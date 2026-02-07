use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};
use fern_labour_labour_shared::value_objects::SubscriberContactMethod;

use crate::durable_object::write_side::{
    domain::{Labour, events::SubscriberRequested},
    process_manager::types::{
        Effect, IdempotencyKey, MotherNotification, NotificationContext, NotificationIntent,
    },
};

impl HasPolicies<Labour, Effect> for SubscriberRequested {
    fn policies() -> &'static [PolicyFn<Self, Labour, Effect>] {
        &[notify_mother_on_subscriber_request]
    }
}

fn notify_mother_on_subscriber_request(
    event: &SubscriberRequested,
    ctx: &PolicyContext<Labour>,
) -> Vec<Effect> {
    let mother_id = ctx.state.mother_id().to_string();

    vec![Effect::SendNotification(NotificationIntent {
        idempotency_key: IdempotencyKey::for_notification(
            event.labour_id,
            ctx.sequence,
            &mother_id,
            "subscriber_requested",
        ),
        context: NotificationContext::Mother {
            recipient_user_id: mother_id,
            channel: SubscriberContactMethod::EMAIL,
            notification: MotherNotification::SubscriberRequested {
                labour_id: event.labour_id,
                subscription_id: event.subscription_id,
                requester_user_id: event.subscriber_id.clone(),
            },
        },
    })]
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
        events::{LabourPhaseChanged, LabourPlanned},
    };

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    }

    fn create_labour() -> Labour {
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
        ];

        Labour::from_events(&events).unwrap()
    }

    #[test]
    fn notifies_mother_on_subscriber_request() {
        let labour = create_labour();
        let subscription_id = Uuid::now_v7();

        let event = SubscriberRequested {
            labour_id: labour_id(),
            subscription_id,
            subscriber_id: "requester_123".to_string(),
            subscriber_name: "John".to_string(),
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        if let Effect::SendNotification(intent) = &effects[0] {
            if let NotificationContext::Mother {
                recipient_user_id,
                notification,
                channel,
            } = &intent.context
            {
                assert_eq!(recipient_user_id, "mother_123");
                assert_eq!(channel, &SubscriberContactMethod::EMAIL);
                let MotherNotification::SubscriberRequested {
                    requester_user_id, ..
                } = notification;
                assert_eq!(requester_user_id, "requester_123");
            } else {
                panic!("Expected Mother context");
            }
        } else {
            panic!("Expected SendNotification effect");
        }
    }

    #[test]
    fn generates_correct_idempotency_key() {
        let labour = create_labour();
        let subscription_id = Uuid::now_v7();

        let event = SubscriberRequested {
            labour_id: labour_id(),
            subscription_id,
            subscriber_id: "requester_123".to_string(),
            subscriber_name: "John".to_string(),
        };
        let ctx = PolicyContext::new(&labour, 42);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        let key = effects[0].idempotency_key();
        let expected_key =
            IdempotencyKey::for_notification(labour_id(), 42, "mother_123", "subscriber_requested");
        assert_eq!(key.0, expected_key.0);
    }
}
