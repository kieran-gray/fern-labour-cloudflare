use std::str::FromStr;

use anyhow::{Context, Result};
use chrono::NaiveDateTime;
use serde::Deserialize;
use worker::SqlStorage;

use fern_labour_event_sourcing_rs::{CheckpointRepository, CheckpointStatus, ProjectionCheckpoint};

#[derive(Deserialize)]
struct CheckpointRow {
    projector_name: String,
    last_processed_sequence: i64,
    last_processed_at: String,
    updated_at: String,
    status: String,
    error_message: Option<String>,
    error_count: i64,
}

impl CheckpointRow {
    /// Convert the row to a ProjectionCheckpoint, consuming it in the process
    fn take_as_checkpoint(self) -> Result<ProjectionCheckpoint> {
        let last_processed_at =
            NaiveDateTime::parse_from_str(&self.last_processed_at, "%Y-%m-%d %H:%M:%S")
                .context("Failed to parse last_processed_at timestamp")?
                .and_utc();

        let updated_at = NaiveDateTime::parse_from_str(&self.updated_at, "%Y-%m-%d %H:%M:%S")
            .context("Failed to parse updated_at timestamp")?
            .and_utc();

        Ok(ProjectionCheckpoint {
            projector_name: self.projector_name,
            last_processed_sequence: self.last_processed_sequence,
            last_processed_at,
            updated_at,
            status: CheckpointStatus::from_str(&self.status)?,
            error_message: self.error_message,
            error_count: self.error_count,
        })
    }
}

pub struct SqlCheckpointRepository {
    sql: SqlStorage,
}

impl SqlCheckpointRepository {
    pub fn create(sql: SqlStorage) -> Self {
        Self { sql }
    }
}

impl CheckpointRepository for SqlCheckpointRepository {
    fn init_schema(&self) -> Result<()> {
        self.sql
            .exec(
                "CREATE TABLE IF NOT EXISTS projection_checkpoints (
                    projector_name TEXT PRIMARY KEY,
                    last_processed_sequence INTEGER NOT NULL DEFAULT 0,
                    last_processed_at DATETIME NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    status TEXT NOT NULL DEFAULT 'healthy',
                    error_message TEXT,
                    error_count INTEGER NOT NULL DEFAULT 0
                )",
                None,
            )
            .context("Failed to create projection_checkpoints table")?;

        self.sql
            .exec(
                "CREATE INDEX IF NOT EXISTS idx_checkpoints_status ON projection_checkpoints(status)",
                None,
            )
            .context("Failed to create index on projection_checkpoints")?;

        Ok(())
    }

    fn get_checkpoint(&self, projector_name: &str) -> Result<Option<ProjectionCheckpoint>> {
        let rows: Vec<CheckpointRow> = self
            .sql
            .exec(
                "SELECT * FROM projection_checkpoints WHERE projector_name = ?1",
                Some(vec![projector_name.into()]),
            )
            .context("Failed in checkpoint query")?
            .to_array()
            .context("Failed to get checkpoints")?;

        match rows.into_iter().next() {
            Some(row) => Ok(Some(row.take_as_checkpoint()?)),
            _ => Ok(None),
        }
    }

    fn update_checkpoint(&self, checkpoint: &ProjectionCheckpoint) -> Result<()> {
        self.sql
            .exec(
                "INSERT OR REPLACE INTO projection_checkpoints (
                    projector_name,
                    last_processed_sequence,
                    last_processed_at,
                    updated_at,
                    status,
                    error_message,
                    error_count
                ) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP, ?4, ?5, ?6)",
                Some(vec![
                    checkpoint.projector_name.clone().into(),
                    (checkpoint.last_processed_sequence as f64).into(),
                    checkpoint
                        .last_processed_at
                        .format("%Y-%m-%d %H:%M:%S")
                        .to_string()
                        .into(),
                    checkpoint.status.as_str().into(),
                    checkpoint.error_message.clone().into(),
                    (checkpoint.error_count as f64).into(),
                ]),
            )
            .context("Failed to update checkpoint")?;

        Ok(())
    }

    fn reset_checkpoint(&self, projector_name: &str) -> Result<()> {
        self.sql
            .exec(
                "DELETE FROM projection_checkpoints WHERE projector_name = ?1",
                Some(vec![projector_name.into()]),
            )
            .context("Failed to reset checkpoint")?;

        Ok(())
    }

    fn get_all_checkpoints(&self) -> Result<Vec<ProjectionCheckpoint>> {
        let rows: Vec<CheckpointRow> = self
            .sql
            .exec(
                "SELECT * FROM projection_checkpoints ORDER BY projector_name",
                None,
            )
            .context("Failed to get all checkpoints")?
            .to_array()
            .context("Failed to deserialize checkpoint rows")?;

        rows.into_iter()
            .map(|row| row.take_as_checkpoint())
            .collect()
    }
}
