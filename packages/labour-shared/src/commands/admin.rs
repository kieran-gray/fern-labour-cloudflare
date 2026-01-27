use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AdminCommand {
    RebuildReadModels { aggregate_id: Uuid },
    DeleteDurableObject { aggregate_id: Uuid },
}

impl AdminCommand {
    pub fn labour_id(&self) -> Uuid {
        match self {
            AdminCommand::RebuildReadModels { aggregate_id } => *aggregate_id,
            AdminCommand::DeleteDurableObject { aggregate_id } => *aggregate_id,
        }
    }

    pub fn command_name(&self) -> &'static str {
        match self {
            AdminCommand::RebuildReadModels { .. } => "AdminCommand::RebuildReadModels",
            AdminCommand::DeleteDurableObject { .. } => "AdminCommand::DeleteDurableObject",
        }
    }
}
