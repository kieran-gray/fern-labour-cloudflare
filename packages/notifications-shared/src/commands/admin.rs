use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::NotificationCommand;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AdminCommand {
    #[serde(rename = "RebuildReadModels")]
    RebuildReadModels { aggregate_id: Uuid },
    #[serde(rename = "DeleteDurableObject")]
    DeleteDurableObject { aggregate_id: Uuid },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AdminApiCommand {
    #[serde(rename = "Admin")]
    Admin(AdminCommand),
    Notification(NotificationCommand),
}

impl AdminApiCommand {
    pub fn notification_id(&self) -> Uuid {
        match self {
            AdminApiCommand::Admin(cmd) => match cmd {
                AdminCommand::RebuildReadModels { aggregate_id } => *aggregate_id,
                AdminCommand::DeleteDurableObject { aggregate_id } => *aggregate_id,
            },
            AdminApiCommand::Notification(cmd) => match cmd {
                NotificationCommand::RequestNotification {
                    notification_id, ..
                } => *notification_id,
                NotificationCommand::StoreRenderedContent {
                    notification_id, ..
                } => *notification_id,
                NotificationCommand::MarkAsDispatched {
                    notification_id, ..
                } => *notification_id,
                NotificationCommand::MarkAsDelivered {
                    notification_id, ..
                } => *notification_id,
                NotificationCommand::MarkAsFailed {
                    notification_id, ..
                } => *notification_id,
                NotificationCommand::MarkContentRedacted { notification_id } => *notification_id,
                NotificationCommand::DeleteNotification { notification_id } => *notification_id,
            },
        }
    }

    pub fn command_name(&self) -> &'static str {
        match self {
            Self::Admin(AdminCommand::RebuildReadModels { .. }) => {
                "AdminCommand::RebuildReadModels"
            }
            Self::Admin(AdminCommand::DeleteDurableObject { .. }) => {
                "AdminCommand::DeleteDurableObject"
            }
            Self::Notification(NotificationCommand::RequestNotification { .. }) => {
                "AdminCommand::RequestNotification"
            }
            Self::Notification(NotificationCommand::StoreRenderedContent { .. }) => {
                "AdminCommand::StoreRenderedContent"
            }
            Self::Notification(NotificationCommand::MarkAsDispatched { .. }) => {
                "AdminCommand::MarkAsDispatched"
            }
            Self::Notification(NotificationCommand::MarkAsDelivered { .. }) => {
                "AdminCommand::MarkAsDelivered"
            }
            Self::Notification(NotificationCommand::MarkAsFailed { .. }) => {
                "AdminCommand::MarkAsFailed"
            }
            Self::Notification(NotificationCommand::MarkContentRedacted { .. }) => {
                "AdminCommand::MarkContentRedacted"
            }
            Self::Notification(NotificationCommand::DeleteNotification { .. }) => {
                "AdminCommand::DeleteNotification"
            }
        }
    }
}
