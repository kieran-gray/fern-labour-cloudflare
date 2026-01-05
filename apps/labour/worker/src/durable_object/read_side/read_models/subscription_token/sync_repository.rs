use anyhow::{Context, Result, anyhow};
use fern_labour_event_sourcing_rs::{DecodedCursor, SyncRepositoryTrait};
use uuid::Uuid;
use worker::SqlStorage;

use super::read_model::{SubscriptionTokenReadModel, SubscriptionTokenRow};

pub trait SubscriptionTokenRepositoryTrait:
    SyncRepositoryTrait<SubscriptionTokenReadModel>
{
    fn get_token(&self) -> Result<Option<SubscriptionTokenReadModel>>;
}

pub struct SqlSubscriptionTokenRepository {
    sql: SqlStorage,
}

impl SqlSubscriptionTokenRepository {
    pub fn create(sql: SqlStorage) -> Self {
        Self { sql }
    }

    pub fn init_schema(&self) -> Result<()> {
        self.sql
            .exec(
                "CREATE TABLE IF NOT EXISTS subscription_token (
                    labour_id TEXT PRIMARY KEY,
                    token TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )",
                None,
            )
            .map_err(|err| anyhow!("Failed to create subscription_token table: {err}"))?;

        Ok(())
    }
}

impl SubscriptionTokenRepositoryTrait for SqlSubscriptionTokenRepository {
    fn get_token(&self) -> Result<Option<SubscriptionTokenReadModel>> {
        let rows: Vec<SubscriptionTokenRow> = self
            .sql
            .exec("SELECT * FROM subscription_token LIMIT 1", None)
            .context("Failed to execute subscription_token query")?
            .to_array()
            .context("Failed to fetch subscription_token")?;

        match rows.into_iter().next() {
            Some(row) => Ok(Some(row.into_read_model()?)),
            None => Ok(None),
        }
    }
}

impl SyncRepositoryTrait<SubscriptionTokenReadModel> for SqlSubscriptionTokenRepository {
    fn get_by_id(&self, labour_id: Uuid) -> Result<SubscriptionTokenReadModel> {
        let rows: Vec<SubscriptionTokenRow> = self
            .sql
            .exec(
                "SELECT * FROM subscription_token WHERE labour_id = ?1",
                Some(vec![labour_id.to_string().into()]),
            )
            .context("Failed to execute subscription_token query")?
            .to_array()
            .context("Failed to fetch subscription_token")?;

        match rows.into_iter().next() {
            Some(row) => row.into_read_model(),
            None => Err(anyhow::anyhow!("Subscription token not found")),
        }
    }

    fn get(
        &self,
        _limit: usize,
        _cursor: Option<DecodedCursor>,
    ) -> Result<Vec<SubscriptionTokenReadModel>> {
        // Only ever one row, ignoring pagination parameters
        let rows: Vec<SubscriptionTokenRow> = self
            .sql
            .exec("SELECT * FROM subscription_token LIMIT 1", None)
            .context("Failed to execute subscription_token query")?
            .to_array()
            .context("Failed to fetch subscription_token")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    fn upsert(&self, token: &SubscriptionTokenReadModel) -> Result<()> {
        let row = SubscriptionTokenRow::from_read_model(token)
            .context("Failed to convert subscription token to row")?;

        let bindings = vec![
            row.labour_id.into(),
            row.token.into(),
            row.created_at.into(),
            row.updated_at.into(),
        ];

        self.sql
            .exec(
                "INSERT INTO subscription_token (
                    labour_id, token, created_at, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(labour_id)
                 DO UPDATE SET
                    token = ?2,
                    updated_at = ?4",
                Some(bindings),
            )
            .map_err(|err| anyhow!("Failed to upsert subscription token: {err}"))?;

        Ok(())
    }

    fn delete(&self, labour_id: Uuid) -> Result<()> {
        self.sql
            .exec(
                "DELETE FROM subscription_token WHERE labour_id = ?1",
                Some(vec![labour_id.to_string().into()]),
            )
            .context("Failed to delete subscription token")?;

        Ok(())
    }

    fn overwrite(&self, token: &SubscriptionTokenReadModel) -> Result<()> {
        let row = SubscriptionTokenRow::from_read_model(token)
            .context("Failed to convert subscription token to row")?;

        let bindings = vec![
            row.labour_id.into(),
            row.token.into(),
            row.created_at.into(),
            row.updated_at.into(),
        ];

        self.sql
            .exec(
                "INSERT OR REPLACE INTO subscription_token (
                    labour_id, token, created_at, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4)",
                Some(bindings),
            )
            .context("Failed to overwrite subscription token")?;

        Ok(())
    }
}
