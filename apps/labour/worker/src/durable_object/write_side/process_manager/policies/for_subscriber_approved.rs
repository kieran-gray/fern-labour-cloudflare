use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};
use fern_labour_labour_shared::value_objects::SubscriberContactMethod;

use crate::durable_object::write_side::{
    domain::{Labour, events::SubscriberApproved},
    process_manager::types::{
        Effect, IdempotencyKey, NotificationContext, NotificationIntent, SubscriberNotification,
    },
};

impl HasPolicies<Labour, Effect> for SubscriberApproved {
    fn policies() -> &'static [PolicyFn<Self, Labour, Effect>] {
        &[notify_subscriber_on_approval]
    }
}

fn notify_subscriber_on_approval(
    event: &SubscriberApproved,
    ctx: &PolicyContext<Labour>,
) -> Vec<Effect> {
    let sender_id = ctx.state.mother_id().to_string();

    let subscription = ctx
        .state
        .subscriptions()
        .iter()
        .find(|s| s.id() == event.subscription_id);

    match subscription {
        Some(subscription) => {
            vec![Effect::SendNotification(NotificationIntent {
                idempotency_key: IdempotencyKey::for_notification(
                    event.labour_id,
                    ctx.sequence,
                    subscription.subscriber_id(),
                    "approved",
                ),
                context: NotificationContext::Subscriber {
                    recipient_user_id: subscription.subscriber_id().to_string(),
                    subscription_id: subscription.id(),
                    channel: SubscriberContactMethod::EMAIL,
                    sender_id: sender_id.clone(),
                    notification: SubscriberNotification::SubscriptionApproved {
                        labour_id: event.labour_id,
                    },
                },
            })]
        }
        None => vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use fern_labour_event_sourcing_rs::{Aggregate, HasPolicies, PolicyContext};
    use fern_labour_labour_shared::value_objects::LabourPhase;
    use uuid::Uuid;

    use crate::durable_object::write_side::domain::{
        LabourEvent,
        events::{
            LabourPhaseChanged, LabourPlanned, SubscriberApproved as SubscriberApprovedEvent,
            SubscriberRequested, SubscriptionTokenSet,
        },
    };

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    }

    fn create_labour_with_approved_subscriber(
        subscription_id: Uuid,
        subscriber_id: &str,
    ) -> Labour {
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
                subscriber_id: subscriber_id.to_string(),
                subscriber_name: "Subscriber".to_string(),
            }),
            LabourEvent::SubscriberApproved(SubscriberApprovedEvent {
                labour_id: labour_id(),
                subscription_id,
            }),
        ];

        Labour::from_events(&events).unwrap()
    }

    #[test]
    fn sends_notification_to_approved_subscriber() {
        let subscription_id = Uuid::now_v7();
        let labour = create_labour_with_approved_subscriber(subscription_id, "subscriber_1");

        let event = SubscriberApproved {
            labour_id: labour_id(),
            subscription_id,
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        if let Effect::SendNotification(intent) = &effects[0] {
            if let NotificationContext::Subscriber {
                recipient_user_id,
                notification,
                channel,
                ..
            } = &intent.context
            {
                assert_eq!(recipient_user_id, "subscriber_1");
                assert!(matches!(
                    notification,
                    SubscriberNotification::SubscriptionApproved { .. }
                ));
                assert_eq!(channel, &SubscriberContactMethod::EMAIL);
            } else {
                panic!("Expected Subscriber context");
            }
        } else {
            panic!("Expected SendNotification effect");
        }
    }

    #[test]
    fn returns_empty_when_subscription_not_found() {
        let subscription_id = Uuid::now_v7();
        let unknown_subscription_id = Uuid::now_v7();
        let labour = create_labour_with_approved_subscriber(subscription_id, "subscriber_1");

        let event = SubscriberApproved {
            labour_id: labour_id(),
            subscription_id: unknown_subscription_id,
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert!(effects.is_empty());
    }

    #[test]
    fn generates_correct_idempotency_key() {
        let subscription_id = Uuid::now_v7();
        let labour = create_labour_with_approved_subscriber(subscription_id, "sub_123");

        let event = SubscriberApproved {
            labour_id: labour_id(),
            subscription_id,
        };
        let ctx = PolicyContext::new(&labour, 42);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        let key = effects[0].idempotency_key();
        let expected_key = IdempotencyKey::for_notification(labour_id(), 42, "sub_123", "approved");
        assert_eq!(key.0, expected_key.0);
    }
}
