use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::value_objects::{
    NotificationChannel, NotificationDestination, NotificationTemplateData, RenderedContent,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum ServiceCommand {
    #[serde(rename = "RenderNotification")]
    RenderNotification {
        notification_id: Uuid,
        channel: NotificationChannel,
        template_data: NotificationTemplateData,
    },

    #[serde(rename = "DispatchNotification")]
    DispatchNotification {
        notification_id: Uuid,
        channel: NotificationChannel,
        destination: NotificationDestination,
        rendered_content: RenderedContent,
    },

    #[serde(rename = "RedactNotificationContent")]
    RedactNotificationContent {
        notification_id: Uuid,
        provider: String,
        external_id: String,
    },
}

impl ServiceCommand {
    pub fn notification_id(&self) -> Uuid {
        match self {
            ServiceCommand::RenderNotification {
                notification_id, ..
            } => *notification_id,
            ServiceCommand::DispatchNotification {
                notification_id, ..
            } => *notification_id,
            ServiceCommand::RedactNotificationContent {
                notification_id, ..
            } => *notification_id,
        }
    }
}
