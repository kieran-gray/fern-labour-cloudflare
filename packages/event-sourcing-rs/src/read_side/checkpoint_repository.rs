use std::str::FromStr;

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectionCheckpoint {
    pub projector_name: String,
    pub last_processed_sequence: i64,
    pub last_processed_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub status: CheckpointStatus,
    pub error_message: Option<String>,
    pub error_count: i64,
}

impl ProjectionCheckpoint {
    pub fn is_faulted(&self, max_errors: i64) -> bool {
        self.status == CheckpointStatus::Error && self.error_count >= max_errors
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CheckpointStatus {
    Healthy,
    Error,
    Stale,
}

impl CheckpointStatus {
    pub fn as_str(&self) -> &str {
        match self {
            CheckpointStatus::Healthy => "healthy",
            CheckpointStatus::Error => "error",
            CheckpointStatus::Stale => "stale",
        }
    }
}

impl FromStr for CheckpointStatus {
    type Err = anyhow::Error;
    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        let val = match s {
            "error" => CheckpointStatus::Error,
            "stale" => CheckpointStatus::Stale,
            _ => CheckpointStatus::Healthy,
        };
        Ok(val)
    }
}

pub trait CheckpointRepository {
    fn init_schema(&self) -> Result<()>;
    fn get_checkpoint(&self, projector_name: &str) -> Result<Option<ProjectionCheckpoint>>;
    fn update_checkpoint(&self, checkpoint: &ProjectionCheckpoint) -> Result<()>;
    fn reset_checkpoint(&self, projector_name: &str) -> Result<()>;
    fn get_all_checkpoints(&self) -> Result<Vec<ProjectionCheckpoint>>;
}
