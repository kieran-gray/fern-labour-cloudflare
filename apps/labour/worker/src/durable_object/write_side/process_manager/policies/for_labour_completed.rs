use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};
use fern_labour_labour_shared::value_objects::subscriber::status::SubscriberStatus;

use crate::durable_object::write_side::{
    domain::{Labour, events::LabourCompleted},
    process_manager::types::{
        Effect, IdempotencyKey, NotificationContext, NotificationIntent, SubscriberNotification,
    },
};

impl HasPolicies<Labour, Effect> for LabourCompleted {
    fn policies() -> &'static [PolicyFn<Self, Labour, Effect>] {
        &[notify_subscribers_on_complete]
    }
}

fn notify_subscribers_on_complete(
    event: &LabourCompleted,
    ctx: &PolicyContext<Labour>,
) -> Vec<Effect> {
    let sender_id = ctx.state.mother_id().to_string();

    ctx.state
        .subscriptions()
        .iter()
        .filter(|s| s.status() == &SubscriberStatus::SUBSCRIBED)
        .flat_map(|subscription| {
            let sender_id = sender_id.clone();
            let notes = event.notes.clone();
            subscription.contact_methods().iter().map(move |channel| {
                Effect::SendNotification(NotificationIntent {
                    idempotency_key: IdempotencyKey::for_notification(
                        event.labour_id,
                        ctx.sequence,
                        subscription.subscriber_id(),
                        "labour_completed",
                    ),
                    context: NotificationContext::Subscriber {
                        recipient_user_id: subscription.subscriber_id().to_string(),
                        subscription_id: subscription.id(),
                        channel: channel.clone(),
                        sender_id: sender_id.clone(),
                        notification: SubscriberNotification::LabourCompleted {
                            labour_id: event.labour_id,
                            notes: notes.clone(),
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

    fn create_labour_with_subscribers(
        subscriptions: Vec<(Uuid, &str, SubscriberStatus, Vec<SubscriberContactMethod>)>,
    ) -> Labour {
        let mut events: Vec<LabourEvent> = vec![
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
        ];

        for (subscription_id, subscriber_id, status, contact_methods) in subscriptions {
            events.push(LabourEvent::SubscriberRequested(SubscriberRequested {
                labour_id: labour_id(),
                subscription_id,
                subscriber_id: subscriber_id.to_string(),
                subscriber_name: "Subscriber".to_string(),
            }));

            if status == SubscriberStatus::SUBSCRIBED {
                events.push(LabourEvent::SubscriberApproved(SubscriberApproved {
                    labour_id: labour_id(),
                    subscription_id,
                }));
            }

            if !contact_methods.is_empty() {
                events.push(LabourEvent::SubscriberNotificationMethodsUpdated(
                    SubscriberNotificationMethodsUpdated {
                        labour_id: labour_id(),
                        subscription_id,
                        notification_methods: contact_methods,
                    },
                ));
            }
        }

        Labour::from_events(&events).unwrap()
    }

    #[test]
    fn notifies_subscribed_subscribers_per_contact_method() {
        let subscription_id = Uuid::now_v7();
        let labour = create_labour_with_subscribers(vec![(
            subscription_id,
            "subscriber_1",
            SubscriberStatus::SUBSCRIBED,
            vec![SubscriberContactMethod::EMAIL, SubscriberContactMethod::SMS],
        )]);

        let event = LabourCompleted {
            labour_id: labour_id(),
            end_time: Utc::now(),
            notes: Some("Baby arrived!".to_string()),
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 2);
        for effect in &effects {
            if let Effect::SendNotification(intent) = effect {
                if let NotificationContext::Subscriber {
                    recipient_user_id,
                    notification,
                    ..
                } = &intent.context
                {
                    assert_eq!(recipient_user_id, "subscriber_1");
                    assert!(matches!(
                        notification,
                        SubscriberNotification::LabourCompleted { .. }
                    ));
                } else {
                    panic!("Expected Subscriber context");
                }
            } else {
                panic!("Expected SendNotification effect");
            }
        }
    }

    #[test]
    fn ignores_non_subscribed_subscribers() {
        let labour = create_labour_with_subscribers(vec![(
            Uuid::now_v7(),
            "subscriber_requested",
            SubscriberStatus::REQUESTED,
            vec![SubscriberContactMethod::EMAIL],
        )]);

        let event = LabourCompleted {
            labour_id: labour_id(),
            end_time: Utc::now(),
            notes: None,
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert!(effects.is_empty());
    }

    #[test]
    fn returns_empty_when_no_subscribers() {
        let labour = create_labour_with_subscribers(vec![]);

        let event = LabourCompleted {
            labour_id: labour_id(),
            end_time: Utc::now(),
            notes: None,
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert!(effects.is_empty());
    }

    #[test]
    fn generates_correct_idempotency_keys() {
        let subscription_id = Uuid::now_v7();
        let labour = create_labour_with_subscribers(vec![(
            subscription_id,
            "sub_123",
            SubscriberStatus::SUBSCRIBED,
            vec![SubscriberContactMethod::EMAIL],
        )]);

        let event = LabourCompleted {
            labour_id: labour_id(),
            end_time: Utc::now(),
            notes: None,
        };
        let ctx = PolicyContext::new(&labour, 42);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        let key = effects[0].idempotency_key();
        let expected_key =
            IdempotencyKey::for_notification(labour_id(), 42, "sub_123", "labour_completed");
        assert_eq!(key.0, expected_key.0);
    }
}
