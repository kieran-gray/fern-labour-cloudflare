use anyhow::{Context, Result, anyhow};
use serde::Deserialize;
use uuid::Uuid;
use worker::SqlStorage;

use super::types::Effect;

#[derive(Debug, Clone, Deserialize)]
pub struct EffectRecord {
    pub effect_id: String,
    pub event_sequence: i64,
    pub effect_type: String,
    pub effect_payload: String,
    pub idempotency_key: String,
    pub status: String,
    pub attempts: i64,
    pub last_attempt_at: Option<String>,
    pub last_error: Option<String>,
    pub created_at: String,
}

pub struct EffectLedger {
    sql: SqlStorage,
}

impl EffectLedger {
    pub fn create(sql: SqlStorage) -> Self {
        Self { sql }
    }

    pub fn init_schema(&self) -> Result<()> {
        self.sql
            .exec(
                "CREATE TABLE IF NOT EXISTS process_manager_state (
                    id INTEGER PRIMARY KEY,
                    last_processed_sequence INTEGER NOT NULL DEFAULT 0,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )",
                None,
            )
            .context("Failed to create process_manager_state table")?;

        self.sql
            .exec(
                "CREATE TABLE IF NOT EXISTS pending_effects (
                    effect_id TEXT PRIMARY KEY,
                    event_sequence INTEGER NOT NULL,
                    effect_type TEXT NOT NULL,
                    effect_payload TEXT NOT NULL,
                    idempotency_key TEXT NOT NULL UNIQUE,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    attempts INTEGER NOT NULL DEFAULT 0,
                    last_attempt_at DATETIME,
                    last_error TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )",
                None,
            )
            .context("Failed to create pending_effects table")?;

        self.sql
            .exec(
                "CREATE INDEX IF NOT EXISTS idx_pending_effects_status
                 ON pending_effects(status)",
                None,
            )
            .context("Failed to create index on pending_effects")?;

        Ok(())
    }

    pub fn get_last_processed_sequence(&self) -> Result<i64> {
        #[derive(Deserialize)]
        struct Row {
            last_processed_sequence: Option<i64>,
        }

        let result: Option<Row> = self
            .sql
            .exec(
                "SELECT last_processed_sequence FROM process_manager_state",
                None,
            )
            .context("Failed to get last processed sequence")?
            .to_array::<Row>()?
            .into_iter()
            .next();

        Ok(result
            .map(|r| r.last_processed_sequence.unwrap_or(0))
            .unwrap_or(0))
    }

    pub fn persist_effects(&self, effects: &[Effect], sequence: i64) -> Result<()> {
        for effect in effects {
            let effect_id = Uuid::now_v7().to_string();
            let effect_payload =
                serde_json::to_string(effect).context("Failed to serialize effect to JSON")?;

            self.sql
                .exec(
                    "INSERT OR IGNORE INTO pending_effects
                     (effect_id, event_sequence, effect_type, effect_payload, idempotency_key)
                     VALUES (?1, ?2, ?3, ?4, ?5)",
                    Some(vec![
                        effect_id.into(),
                        sequence.into(),
                        effect.effect_type().into(),
                        effect_payload.into(),
                        effect.idempotency_key().0.clone().into(),
                    ]),
                )
                .context("Failed to insert effect into pending_effects")?;
        }

        self.sql
            .exec(
                "INSERT INTO process_manager_state (id, last_processed_sequence)
                 VALUES (1, ?1)
                 ON CONFLICT(id) DO UPDATE SET
                    last_processed_sequence = ?1,
                    updated_at = CURRENT_TIMESTAMP",
                Some(vec![sequence.into()]),
            )
            .context("Failed to update last_processed_sequence")?;

        Ok(())
    }

    pub fn get_pending_effects(&self, max_attempts: i64) -> Result<Vec<EffectRecord>> {
        self.sql
            .exec(
                "SELECT * FROM pending_effects
                 WHERE status IN ('PENDING', 'DISPATCHED')
                   AND attempts < ?1
                 ORDER BY created_at ASC",
                Some(vec![max_attempts.into()]),
            )
            .context("Failed to query pending effects")?
            .to_array()
            .context("Failed to deserialize effect records")
    }

    pub fn mark_dispatched(&self, effect_id: &str) -> Result<()> {
        self.sql
            .exec(
                "UPDATE pending_effects
                 SET status = 'DISPATCHED',
                     attempts = attempts + 1,
                     last_attempt_at = CURRENT_TIMESTAMP
                 WHERE effect_id = ?1",
                Some(vec![effect_id.into()]),
            )
            .context("Failed to mark effect as dispatched")?;
        Ok(())
    }

    pub fn mark_completed(&self, effect_id: &str) -> Result<()> {
        self.sql
            .exec(
                "UPDATE pending_effects SET status = 'COMPLETED' WHERE effect_id = ?1",
                Some(vec![effect_id.into()]),
            )
            .context("Failed to mark effect as completed")?;
        Ok(())
    }

    pub fn mark_failed(&self, effect_id: &str, error: &str, exhausted: bool) -> Result<()> {
        let status = if exhausted { "FAILED" } else { "DISPATCHED" };
        self.sql
            .exec(
                "UPDATE pending_effects
                 SET status = ?1, last_error = ?2
                 WHERE effect_id = ?3",
                Some(vec![status.into(), error.into(), effect_id.into()]),
            )
            .context("Failed to mark effect as failed")?;
        Ok(())
    }

    pub fn has_pending_effects(&self, max_attempts: i64) -> Result<bool> {
        #[derive(Deserialize)]
        struct CountResult {
            count: i64,
        }

        let results = self
            .sql
            .exec(
                "SELECT COUNT(*) as count FROM pending_effects
                 WHERE status IN ('PENDING', 'DISPATCHED')
                   AND attempts < ?1",
                Some(vec![max_attempts.into()]),
            )
            .context("Failed to check for pending effects")?
            .to_array::<CountResult>()
            .context("Failed to get count result")?;

        match results.as_slice() {
            [count_result] => Ok(count_result.count > 0),
            _ => Err(anyhow!("No max sequence results found")),
        }
    }
}
