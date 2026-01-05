use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::value_objects::SubscriberRole;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum SubscriptionCommand {
    ApproveSubscriber {
        labour_id: Uuid,
        subscription_id: Uuid,
    },

    RemoveSubscriber {
        labour_id: Uuid,
        subscription_id: Uuid,
    },

    BlockSubscriber {
        labour_id: Uuid,
        subscription_id: Uuid,
    },

    UnblockSubscriber {
        labour_id: Uuid,
        subscription_id: Uuid,
    },

    UpdateSubscriberRole {
        labour_id: Uuid,
        subscription_id: Uuid,
        role: SubscriberRole,
    },

    InvalidateSubscriptionToken {
        labour_id: Uuid
    }
}

impl SubscriptionCommand {
    pub fn labour_id(&self) -> Uuid {
        match self {
            SubscriptionCommand::ApproveSubscriber { labour_id, .. } => *labour_id,
            SubscriptionCommand::RemoveSubscriber { labour_id, .. } => *labour_id,
            SubscriptionCommand::BlockSubscriber { labour_id, .. } => *labour_id,
            SubscriptionCommand::UnblockSubscriber { labour_id, .. } => *labour_id,
            SubscriptionCommand::UpdateSubscriberRole { labour_id, .. } => *labour_id,
            SubscriptionCommand::InvalidateSubscriptionToken { labour_id } => *labour_id,
        }
    }
}
