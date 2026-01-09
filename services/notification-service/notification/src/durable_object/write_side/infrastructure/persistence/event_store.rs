use std::rc::Rc;

use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use chrono::NaiveDateTime;
use serde::Deserialize;
use worker::SqlStorage;

use fern_labour_event_sourcing_rs::{AppendResult, EventStoreTrait, StoredEvent, StoredEventRow};

#[derive(Deserialize)]
struct SequenceResult {
    sequence: i64,
    created_at: String,
}

pub struct SqlEventStore {
    pub sql: SqlStorage,
}

impl SqlEventStore {
    pub fn create(sql: SqlStorage) -> Rc<dyn EventStoreTrait> {
        Rc::new(Self { sql })
    }
}

#[async_trait(?Send)]
impl EventStoreTrait for SqlEventStore {
    fn init_schema(&self) -> Result<()> {
        self.sql
            .exec(
                "CREATE TABLE IF NOT EXISTS events (
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    aggregate_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_data TEXT NOT NULL,
                    event_version INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    user_id TEXT NOT NULL
                )",
                None,
            )
            .context("Failed to create events table")?;
        Ok(())
    }

    fn append(
        &self,
        aggregate_id: String,
        event: StoredEvent,
        user_id: String,
    ) -> Result<AppendResult> {
        let result = self
            .sql
            .exec(
                "INSERT INTO events (aggregate_id, event_type, event_version, event_data, user_id)
                 VALUES (?1, ?2, ?3, ?4, ?5)
                 RETURNING sequence, created_at",
                Some(vec![
                    aggregate_id.into(),
                    event.event_type.into(),
                    event.event_version.into(),
                    event.event_data.into(),
                    user_id.into(),
                ]),
            )
            .context("Failed to insert event into event store")?
            .one::<SequenceResult>()
            .context("Failed to parse sequence result")?;

        let timestamp = NaiveDateTime::parse_from_str(&result.created_at, "%Y-%m-%d %H:%M:%S")
            .context("Failed to parse created_at timestamp from SQLite")?
            .and_utc();

        Ok(AppendResult {
            sequence: result.sequence,
            timestamp,
        })
    }

    fn load(&self) -> Result<Vec<StoredEventRow>> {
        let rows: Vec<StoredEventRow> = self
            .sql
            .exec("SELECT * FROM events ORDER BY sequence ASC", None)
            .context("Failed to load events from store")?
            .to_array()
            .context("Failed to deserialize event rows")?;

        Ok(rows)
    }

    fn events_since(&self, sequence: i64, limit: i64) -> Result<Vec<StoredEventRow>> {
        let rows: Vec<StoredEventRow> = self
            .sql
            .exec(
                "SELECT * FROM events WHERE sequence > ?1 ORDER BY sequence ASC LIMIT ?2",
                Some(vec![(sequence as f64).into(), (limit as f64).into()]),
            )
            .context("Failed to load events since sequence")?
            .to_array()
            .context("Failed to deserialize event rows")?;

        Ok(rows)
    }

    fn max_sequence(&self) -> Result<Option<i64>> {
        #[derive(Deserialize)]
        struct MaxSequenceResult {
            max_seq: Option<i64>,
        }

        let results = self
            .sql
            .exec("SELECT MAX(sequence) as max_seq FROM events", None)
            .context("Failed to query max sequence")?
            .to_array::<MaxSequenceResult>()
            .context("Failed to parse max sequence result")?;

        match results.as_slice() {
            [sequence_result] => Ok(sequence_result.max_seq),
            _ => Err(anyhow!("No max sequence results found")),
        }
    }
}
