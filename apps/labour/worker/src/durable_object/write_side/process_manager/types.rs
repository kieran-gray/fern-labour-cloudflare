use fern_labour_labour_shared::value_objects::SubscriberContactMethod;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::durable_object::write_side::domain::LabourCommand;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct IdempotencyKey(pub String);

impl IdempotencyKey {
    pub fn for_notification(
        aggregate_id: Uuid,
        event_sequence: i64,
        recipient_id: &str,
        notification_type: &str,
    ) -> Self {
        Self(format!(
            "{}:{}:notify:{}:{}",
            aggregate_id, event_sequence, recipient_id, notification_type
        ))
    }

    pub fn for_command(aggregate_id: Uuid, event_sequence: i64, command_type: &str) -> Self {
        Self(format!(
            "{}:{}:cmd:{}",
            aggregate_id, event_sequence, command_type
        ))
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub enum Effect {
    SendNotification(NotificationIntent),
    IssueCommand {
        command: LabourCommand,
        idempotency_key: IdempotencyKey,
    },
    GenerateSubscriptionToken {
        labour_id: Uuid,
        idempotency_key: IdempotencyKey,
    },
}

impl Effect {
    pub fn idempotency_key(&self) -> &IdempotencyKey {
        match self {
            Effect::SendNotification(intent) => &intent.idempotency_key,
            Effect::IssueCommand {
                idempotency_key, ..
            } => idempotency_key,
            Effect::GenerateSubscriptionToken {
                idempotency_key, ..
            } => idempotency_key,
        }
    }

    pub fn effect_type(&self) -> &'static str {
        match self {
            Effect::SendNotification(_) => "NOTIFICATION",
            Effect::IssueCommand { .. } => "COMMAND",
            Effect::GenerateSubscriptionToken { .. } => "COMMAND",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationIntent {
    pub idempotency_key: IdempotencyKey,
    pub context: NotificationContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "recipient_type")]
pub enum NotificationContext {
    Subscriber {
        recipient_user_id: String,
        subscription_id: Uuid,
        channel: SubscriberContactMethod,
        sender_id: String,
        notification: SubscriberNotification,
    },
    Mother {
        recipient_user_id: String,
        channel: SubscriberContactMethod,
        notification: MotherNotification,
    },
    Email {
        email: String,
        sender_id: String,
        notification: EmailNotification,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SubscriberNotification {
    LabourBegun {
        labour_id: Uuid,
    },
    LabourCompleted {
        labour_id: Uuid,
        notes: Option<String>,
    },
    AnnouncementPosted {
        labour_id: Uuid,
        message: String,
    },
    SubscriptionApproved {
        labour_id: Uuid,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MotherNotification {
    SubscriberRequested {
        labour_id: Uuid,
        subscription_id: Uuid,
        requester_user_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum EmailNotification {
    LabourInvite { labour_id: Uuid },
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
