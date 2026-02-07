use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};

use crate::durable_object::write_side::{
    domain::{Labour, events::LabourInviteSent},
    process_manager::types::{
        Effect, EmailNotification, IdempotencyKey, NotificationContext, NotificationIntent,
    },
};

impl HasPolicies<Labour, Effect> for LabourInviteSent {
    fn policies() -> &'static [PolicyFn<Self, Labour, Effect>] {
        &[send_labour_invite_email]
    }
}

fn send_labour_invite_email(event: &LabourInviteSent, ctx: &PolicyContext<Labour>) -> Vec<Effect> {
    let sender_id = ctx.state.mother_id().to_string();

    vec![Effect::SendNotification(NotificationIntent {
        idempotency_key: IdempotencyKey::for_notification(
            event.labour_id,
            ctx.sequence,
            &event.invite_email,
            "invite",
        ),
        context: NotificationContext::Email {
            email: event.invite_email.clone(),
            sender_id,
            notification: EmailNotification::LabourInvite {
                labour_id: event.labour_id,
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
    fn sends_invite_email_to_recipient() {
        let labour = create_labour();

        let event = LabourInviteSent {
            labour_id: labour_id(),
            invite_email: "friend@example.com".to_string(),
        };
        let ctx = PolicyContext::new(&labour, 5);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        if let Effect::SendNotification(intent) = &effects[0] {
            if let NotificationContext::Email {
                email,
                sender_id,
                notification,
            } = &intent.context
            {
                assert_eq!(email, "friend@example.com");
                assert_eq!(sender_id, "mother_123");
                assert!(matches!(
                    notification,
                    EmailNotification::LabourInvite { .. }
                ));
            } else {
                panic!("Expected Email context");
            }
        } else {
            panic!("Expected SendNotification effect");
        }
    }

    #[test]
    fn generates_correct_idempotency_key() {
        let labour = create_labour();

        let event = LabourInviteSent {
            labour_id: labour_id(),
            invite_email: "test@test.com".to_string(),
        };
        let ctx = PolicyContext::new(&labour, 42);

        let effects = event.apply_policies(&ctx);

        let key = effects[0].idempotency_key();
        let expected = IdempotencyKey::for_notification(labour_id(), 42, "test@test.com", "invite");
        assert_eq!(key.0, expected.0);
    }
}
