use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::InternalCommand;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AdminCommand {
    #[serde(rename = "RebuildReadModels")]
    RebuildReadModels { aggregate_id: Uuid },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AdminApiCommand {
    #[serde(rename = "Admin")]
    Admin(AdminCommand),

    #[serde(rename = "Internal")]
    Internal(InternalCommand),
}

impl AdminApiCommand {
    pub fn notification_id(&self) -> Uuid {
        match self {
            AdminApiCommand::Admin(cmd) => match cmd {
                AdminCommand::RebuildReadModels { aggregate_id } => *aggregate_id,
            },
            AdminApiCommand::Internal(cmd) => cmd.notification_id(),
        }
    }

    pub fn command_name(&self) -> &'static str {
        match self {
            AdminApiCommand::Admin(AdminCommand::RebuildReadModels { .. }) => {
                "AdminCommand::RebuildReadModels"
            }
            AdminApiCommand::Internal(InternalCommand::StoreRenderedContent { .. }) => {
                "InternalCommand::StoreRenderedContent"
            }
            AdminApiCommand::Internal(InternalCommand::MarkAsDispatched { .. }) => {
                "InternalCommand::MarkAsDispatched"
            }
            AdminApiCommand::Internal(InternalCommand::MarkAsDelivered { .. }) => {
                "InternalCommand::MarkAsDelivered"
            }
            AdminApiCommand::Internal(InternalCommand::MarkAsFailed { .. }) => {
                "InternalCommand::MarkAsFailed"
            }
        }
    }
}
