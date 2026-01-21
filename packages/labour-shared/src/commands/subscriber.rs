use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::value_objects::{SubscriberAccessLevel, SubscriberContactMethod};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum SubscriberCommand {
    RequestAccess {
        labour_id: Uuid,
        subscriber_name: String,
        token: String,
    },

    Unsubscribe {
        labour_id: Uuid,
        subscription_id: Uuid,
    },

    UpdateNotificationMethods {
        labour_id: Uuid,
        subscription_id: Uuid,
        notification_methods: Vec<SubscriberContactMethod>,
    },

    UpdateAccessLevel {
        labour_id: Uuid,
        subscription_id: Uuid,
        access_level: SubscriberAccessLevel,
    },
}

impl SubscriberCommand {
    pub fn labour_id(&self) -> Uuid {
        match self {
            SubscriberCommand::RequestAccess { labour_id, .. } => *labour_id,
            SubscriberCommand::Unsubscribe { labour_id, .. } => *labour_id,
            SubscriberCommand::UpdateNotificationMethods { labour_id, .. } => *labour_id,
            SubscriberCommand::UpdateAccessLevel { labour_id, .. } => *labour_id,
        }
    }
}
