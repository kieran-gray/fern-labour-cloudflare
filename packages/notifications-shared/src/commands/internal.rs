use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::value_objects::RenderedContent;

// I'm keeping this command type and the domain NotificationCommand type seperate on purpose.

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum InternalCommand {
    #[serde(rename = "StoreRenderedContent")]
    StoreRenderedContent {
        notification_id: Uuid,
        rendered_content: RenderedContent,
    },

    #[serde(rename = "MarkAsDispatched")]
    MarkAsDispatched {
        notification_id: Uuid,
        external_id: Option<String>,
    },

    #[serde(rename = "MarkAsDelivered")]
    MarkAsDelivered { notification_id: Uuid },

    #[serde(rename = "MarkAsFailed")]
    MarkAsFailed {
        notification_id: Uuid,
        reason: Option<String>,
    },
}

impl InternalCommand {
    pub fn notification_id(&self) -> Uuid {
        match self {
            InternalCommand::StoreRenderedContent {
                notification_id, ..
            } => *notification_id,
            InternalCommand::MarkAsDispatched {
                notification_id, ..
            } => *notification_id,
            InternalCommand::MarkAsDelivered { notification_id } => *notification_id,
            InternalCommand::MarkAsFailed {
                notification_id, ..
            } => *notification_id,
        }
    }
}
