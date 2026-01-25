use fern_labour_notifications_shared::ServiceCommand;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::durable_object::write_side::domain::NotificationCommand;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct IdempotencyKey(pub String);

impl IdempotencyKey {
    pub fn for_command(aggregate_id: Uuid, event_sequence: i64, command_type: &str) -> Self {
        Self(format!(
            "{}:{}:cmd:{}",
            aggregate_id, event_sequence, command_type
        ))
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub enum Effect {
    ServiceCommand {
        command: ServiceCommand,
        idempotency_key: IdempotencyKey,
    },
    DomainCommand {
        command: NotificationCommand,
        idempotency_key: IdempotencyKey,
    },
}

impl Effect {
    pub fn idempotency_key(&self) -> &IdempotencyKey {
        match self {
            Effect::ServiceCommand {
                idempotency_key, ..
            } => idempotency_key,
            Effect::DomainCommand {
                idempotency_key, ..
            } => idempotency_key,
        }
    }

    pub fn effect_type(&self) -> &'static str {
        match self {
            Effect::ServiceCommand { .. } => "SERVICE_COMMAND",
            Effect::DomainCommand { .. } => "DOMAIN_COMMAND",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum EffectStatus {
    Pending,
    Dispatched,
    Completed,
    Failed,
}

impl std::fmt::Display for EffectStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EffectStatus::Pending => write!(f, "PENDING"),
            EffectStatus::Dispatched => write!(f, "DISPATCHED"),
            EffectStatus::Completed => write!(f, "COMPLETED"),
            EffectStatus::Failed => write!(f, "FAILED"),
        }
    }
}
