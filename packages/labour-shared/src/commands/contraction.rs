use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum ContractionCommand {
    StartContraction {
        labour_id: Uuid,
        contraction_id: Uuid,
        start_time: Option<DateTime<Utc>>,
    },
    EndContraction {
        labour_id: Uuid,
        contraction_id: Uuid,
        end_time: Option<DateTime<Utc>>,
        intensity: u8,
    },
    UpdateContraction {
        labour_id: Uuid,
        contraction_id: Uuid,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        intensity: Option<u8>,
    },
    DeleteContraction {
        labour_id: Uuid,
        contraction_id: Uuid,
    },
}

impl ContractionCommand {
    pub fn labour_id(&self) -> Uuid {
        match self {
            ContractionCommand::StartContraction { labour_id, .. } => *labour_id,
            ContractionCommand::EndContraction { labour_id, .. } => *labour_id,
            ContractionCommand::UpdateContraction { labour_id, .. } => *labour_id,
            ContractionCommand::DeleteContraction { labour_id, .. } => *labour_id,
        }
    }
}
