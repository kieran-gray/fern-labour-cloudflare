use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};
use fern_labour_labour_shared::value_objects::{
    LabourUpdateType, subscriber::status::SubscriberStatus,
};

use crate::durable_object::write_side::{
    domain::{Labour, events::LabourUpdatePosted},
    process_manager::types::{
        Effect, IdempotencyKey, NotificationContext, NotificationIntent, SubscriberNotification,
    },
};

impl HasPolicies<Labour, Effect> for LabourUpdatePosted {
    fn policies() -> &'static [PolicyFn<Self, Labour, Effect>] {
        &[notify_subscribers_on_announcement]
    }
}

fn notify_subscribers_on_announcement(
    event: &LabourUpdatePosted,
    ctx: &PolicyContext<Labour>,
) -> Vec<Effect> {
    if event.labour_update_type != LabourUpdateType::ANNOUNCEMENT || event.application_generated {
        return vec![];
    }

    let sender_id = ctx.state.mother_id().to_string();

    ctx.state
        .subscriptions()
        .iter()
        .filter(|s| s.status() == &SubscriberStatus::SUBSCRIBED)
        .flat_map(|subscription| {
            let sender_id = sender_id.clone();
            let message = event.message.clone();
            subscription.contact_methods().iter().map(move |channel| {
                Effect::SendNotification(NotificationIntent {
                    idempotency_key: IdempotencyKey::for_notification(
                        event.labour_id,
                        ctx.sequence,
                        subscription.subscriber_id(),
                        "announcement",
                    ),
                    context: NotificationContext::Subscriber {
                        recipient_user_id: subscription.subscriber_id().to_string(),
                        subscription_id: subscription.id(),
                        channel: channel.clone(),
                        sender_id: sender_id.clone(),
                        notification: SubscriberNotification::AnnouncementPosted {
                            labour_id: event.labour_id,
                            message: message.clone(),
                        },
                    },
                })
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use fern_labour_event_sourcing_rs::{Aggregate, HasPolicies, PolicyContext};
    use fern_labour_labour_shared::value_objects::{LabourPhase, SubscriberContactMethod};
    use uuid::Uuid;

    use crate::durable_object::write_side::domain::{
        LabourEvent,
        events::{
            LabourPhaseChanged, LabourPlanned, SubscriberApproved,
            SubscriberNotificationMethodsUpdated, SubscriberRequested, SubscriptionTokenSet,
        },
    };

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    }

    fn create_labour_with_subscriber() -> Labour {
        let subscription_id = Uuid::now_v7();
        let events: Vec<LabourEvent> = vec![
            LabourEvent::LabourPlanned(LabourPlanned {
                labour_id: labour_id(),
                mother_id: "mother_123".to_string(),
                mother_name: "Test Mother".to_string(),
                first_labour: true,
                due_date: Utc::now(),
                labour_name: Some("Baby Smith".to_string()),
            }),
            LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: labour_id(),
                labour_phase: LabourPhase::PLANNED,
            }),
            LabourEvent::SubscriptionTokenSet(SubscriptionTokenSet {
                labour_id: labour_id(),
                token: "token".to_string(),
            }),
            LabourEvent::SubscriberRequested(SubscriberRequested {
                labour_id: labour_id(),
                subscription_id,
                subscriber_id: "subscriber_1".to_string(),
                subscriber_name: "Sub".to_string(),
            }),
            LabourEvent::SubscriberApproved(SubscriberApproved {
                labour_id: labour_id(),
                subscription_id,
            }),
            LabourEvent::SubscriberNotificationMethodsUpdated(
                SubscriberNotificationMethodsUpdated {
                    labour_id: labour_id(),
                    subscription_id,
                    notification_methods: vec![SubscriberContactMethod::EMAIL],
                },
            ),
        ];

        Labour::from_events(&events).unwrap()
    }

    #[test]
    fn announcement_notifies_subscribers() {
        let labour = create_labour_with_subscriber();

        let event = LabourUpdatePosted {
            labour_id: labour_id(),
            labour_update_id: Uuid::now_v7(),
            labour_update_type: LabourUpdateType::ANNOUNCEMENT,
            message: "Hello everyone!".to_string(),
            application_generated: false,
            sent_time: Utc::now(),
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        if let Effect::SendNotification(intent) = &effects[0] {
            if let NotificationContext::Subscriber { notification, .. } = &intent.context {
                assert!(matches!(
                    notification,
                    SubscriberNotification::AnnouncementPosted { message, .. } if message == "Hello everyone!"
                ));
            } else {
                panic!("Expected Subscriber context");
            }
        } else {
            panic!("Expected SendNotification effect");
        }
    }

    #[test]
    fn ignores_non_announcement_updates() {
        let labour = create_labour_with_subscriber();

        let event = LabourUpdatePosted {
            labour_id: labour_id(),
            labour_update_id: Uuid::now_v7(),
            labour_update_type: LabourUpdateType::PRIVATE_NOTE,
            message: "Private note".to_string(),
            application_generated: false,
            sent_time: Utc::now(),
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert!(effects.is_empty());
    }

    #[test]
    fn ignores_application_generated_updates() {
        let labour = create_labour_with_subscriber();

        let event = LabourUpdatePosted {
            labour_id: labour_id(),
            labour_update_id: Uuid::now_v7(),
            labour_update_type: LabourUpdateType::ANNOUNCEMENT,
            message: "System message".to_string(),
            application_generated: true,
            sent_time: Utc::now(),
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert!(effects.is_empty());
    }

    #[test]
    fn generates_correct_idempotency_key() {
        let labour = create_labour_with_subscriber();

        let event = LabourUpdatePosted {
            labour_id: labour_id(),
            labour_update_id: Uuid::now_v7(),
            labour_update_type: LabourUpdateType::ANNOUNCEMENT,
            message: "Test".to_string(),
            application_generated: false,
            sent_time: Utc::now(),
        };
        let ctx = PolicyContext::new(&labour, 42);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        let key = effects[0].idempotency_key();
        let expected =
            IdempotencyKey::for_notification(labour_id(), 42, "subscriber_1", "announcement");
        assert_eq!(key.0, expected.0);
    }
}
