use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};

use crate::durable_object::write_side::{
    domain::{Labour, events::LabourPlanned},
    process_manager::types::{Effect, IdempotencyKey},
};

impl HasPolicies<Labour, Effect> for LabourPlanned {
    fn policies() -> &'static [PolicyFn<Self, Labour, Effect>] {
        &[generate_subscription_token]
    }
}

fn generate_subscription_token(event: &LabourPlanned, ctx: &PolicyContext<Labour>) -> Vec<Effect> {
    vec![Effect::GenerateSubscriptionToken {
        labour_id: event.labour_id,
        idempotency_key: IdempotencyKey::for_command(
            event.labour_id,
            ctx.sequence,
            "generate_subscription_token",
        ),
    }]
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use fern_labour_event_sourcing_rs::{Aggregate, HasPolicies, PolicyContext};
    use fern_labour_labour_shared::value_objects::LabourPhase;
    use uuid::Uuid;

    use crate::durable_object::write_side::domain::{LabourEvent, events::LabourPhaseChanged};

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
    fn generates_subscription_token_effect() {
        let labour = create_labour();

        let event = LabourPlanned {
            labour_id: labour_id(),
            mother_id: "mother_123".to_string(),
            mother_name: "Test Mother".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: Some("Baby Smith".to_string()),
        };
        let ctx = PolicyContext::new(&labour, 1);

        let effects = event.apply_policies(&ctx);

        assert_eq!(effects.len(), 1);
        assert!(matches!(
            &effects[0],
            Effect::GenerateSubscriptionToken { labour_id: lid, .. } if *lid == labour_id()
        ));
    }

    #[test]
    fn generates_correct_idempotency_key() {
        let labour = create_labour();

        let event = LabourPlanned {
            labour_id: labour_id(),
            mother_id: "mother_123".to_string(),
            mother_name: "Test".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: None,
        };
        let ctx = PolicyContext::new(&labour, 42);

        let effects = event.apply_policies(&ctx);

        let key = effects[0].idempotency_key();
        let expected = IdempotencyKey::for_command(labour_id(), 42, "generate_subscription_token");
        assert_eq!(key.0, expected.0);
    }
}
