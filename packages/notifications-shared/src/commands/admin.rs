use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
}

impl AdminApiCommand {
    pub fn notification_id(&self) -> Uuid {
        match self {
            AdminApiCommand::Admin(cmd) => match cmd {
                AdminCommand::RebuildReadModels { aggregate_id } => *aggregate_id,
                AdminCommand::DeleteDurableObject { aggregate_id } => *aggregate_id,
            },
        }
    }

    pub fn command_name(&self) -> &'static str {
        match self {
            AdminApiCommand::Admin(AdminCommand::RebuildReadModels { .. }) => {
                "AdminCommand::RebuildReadModels"
            }
            AdminApiCommand::Admin(AdminCommand::DeleteDurableObject { .. }) => {
                "AdminCommand::DeleteDurableObject"
            }
        }
    }
}
