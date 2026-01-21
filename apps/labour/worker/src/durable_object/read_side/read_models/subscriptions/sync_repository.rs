use anyhow::{Context, Result, anyhow};
use fern_labour_event_sourcing_rs::{DecodedCursor, SyncRepositoryTrait};
use uuid::Uuid;
use worker::SqlStorage;

use super::read_model::{SubscriptionReadModel, SubscriptionRow};

pub trait SubscriptionRepositoryTrait: SyncRepositoryTrait<SubscriptionReadModel> {
    fn get_all(&self) -> Result<Vec<SubscriptionReadModel>>;
    fn get_by_labour_id(&self, labour_id: Uuid) -> Result<Vec<SubscriptionReadModel>>;
    fn get_by_subscriber_id(&self, subscriber_id: &str) -> Result<SubscriptionReadModel>;
}

pub struct SqlSubscriptionRepository {
    sql: SqlStorage,
}

impl SqlSubscriptionRepository {
    pub fn create(sql: SqlStorage) -> Self {
        Self { sql }
    }

    pub fn init_schema(&self) -> Result<()> {
        self.sql
            .exec(
                "CREATE TABLE IF NOT EXISTS subscriptions (
                    subscription_id TEXT PRIMARY KEY,
                    labour_id TEXT NOT NULL,
                    subscriber_name TEXT NOT NULL,
                    subscriber_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    status TEXT NOT NULL,
                    access_level TEXT NOT NULL,
                    contact_methods TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )",
                None,
            )
            .map_err(|err| anyhow!("Failed to create subscriptions table: {err}"))?;

        self.sql
            .exec(
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_id
                 ON subscriptions(subscriber_id ASC)",
                None,
            )
            .context("Failed to create subscriber_id index")?;

        Ok(())
    }
}

impl SubscriptionRepositoryTrait for SqlSubscriptionRepository {
    fn get_all(&self) -> Result<Vec<SubscriptionReadModel>> {
        let rows: Vec<SubscriptionRow> = self
            .sql
            .exec("SELECT * FROM subscriptions ORDER BY created_at ASC", None)
            .context("Failed to execute subscriptions query")?
            .to_array()
            .context("Failed to fetch subscriptions")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    fn get_by_labour_id(&self, labour_id: Uuid) -> Result<Vec<SubscriptionReadModel>> {
        let rows: Vec<SubscriptionRow> = self
            .sql
            .exec(
                "SELECT * FROM subscriptions WHERE labour_id = ?1 ORDER BY created_at ASC",
                Some(vec![labour_id.to_string().into()]),
            )
            .context("Failed to execute subscriptions query")?
            .to_array()
            .context("Failed to fetch subscriptions")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    fn get_by_subscriber_id(&self, subscriber_id: &str) -> Result<SubscriptionReadModel> {
        let rows: Vec<SubscriptionRow> = self
            .sql
            .exec(
                "SELECT * FROM subscriptions WHERE subscriber_id = ?1 ORDER BY created_at ASC",
                Some(vec![subscriber_id.to_string().into()]),
            )
            .context("Failed to execute subscriptions query")?
            .to_array()
            .context("Failed to fetch subscriptions")?;

        match rows.into_iter().next() {
            Some(row) => row.into_read_model(),
            None => Err(anyhow::anyhow!("Subscription not found")),
        }
    }
}

impl SyncRepositoryTrait<SubscriptionReadModel> for SqlSubscriptionRepository {
    fn get_by_id(&self, subscription_id: Uuid) -> Result<SubscriptionReadModel> {
        let rows: Vec<SubscriptionRow> = self
            .sql
            .exec(
                "SELECT * FROM subscriptions WHERE subscription_id = ?1",
                Some(vec![subscription_id.to_string().into()]),
            )
            .context("Failed to execute subscription query")?
            .to_array()
            .context("Failed to fetch subscription")?;

        match rows.into_iter().next() {
            Some(row) => row.into_read_model(),
            None => Err(anyhow::anyhow!("Subscription not found")),
        }
    }

    fn get(
        &self,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<SubscriptionReadModel>> {
        let mut query = "SELECT * FROM subscriptions".to_string();
        let mut bindings = vec![];

        if let Some(cur) = cursor {
            query.push_str(" WHERE updated_at < ?1 OR (updated_at = ?1 AND subscription_id < ?2)");
            bindings.push(cur.last_updated_at.to_rfc3339().into());
            bindings.push(cur.last_id.to_string().into());
        }

        let limit_param_index = bindings.len() + 1;
        query.push_str(&format!(
            " ORDER BY created_at ASC LIMIT ?{}",
            limit_param_index
        ));

        let plus_one_limit = limit + 1;
        bindings.push((plus_one_limit as f64).into());

        let rows: Vec<SubscriptionRow> = self
            .sql
            .exec(&query, Some(bindings))
            .context("Failed to execute subscriptions query")?
            .to_array()
            .context("Failed to fetch subscriptions")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    fn upsert(&self, subscription: &SubscriptionReadModel) -> Result<()> {
        let row = SubscriptionRow::from_read_model(subscription)
            .context("Failed to convert subscription to row")?;

        let bindings = vec![
            row.subscription_id.into(),
            row.labour_id.into(),
            row.subscriber_name.into(),
            row.subscriber_id.into(),
            row.role.into(),
            row.status.into(),
            row.access_level.into(),
            row.contact_methods.into(),
            row.created_at.into(),
            row.updated_at.into(),
        ];

        self.sql
            .exec(
                "INSERT INTO subscriptions (
                    subscription_id, labour_id, subscriber_name, subscriber_id, role, status, access_level,
                    contact_methods, created_at, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
                 ON CONFLICT(subscription_id)
                 DO UPDATE SET
                    subscriber_name = ?3,
                    role = ?5,
                    status = ?6,
                    access_level = ?7,
                    contact_methods = ?8,
                    updated_at = ?10",
                Some(bindings),
            )
            .map_err(|err| anyhow!("Failed to upsert subscription: {err}"))?;

        Ok(())
    }

    fn delete(&self, subscription_id: Uuid) -> Result<()> {
        self.sql
            .exec(
                "DELETE FROM subscriptions WHERE subscription_id = ?1",
                Some(vec![subscription_id.to_string().into()]),
            )
            .context("Failed to delete subscription")?;

        Ok(())
    }

    fn overwrite(&self, subscription: &SubscriptionReadModel) -> Result<()> {
        let row = SubscriptionRow::from_read_model(subscription)
            .context("Failed to convert subscription to row")?;

        let bindings = vec![
            row.subscription_id.into(),
            row.labour_id.into(),
            row.subscriber_name.into(),
            row.subscriber_id.into(),
            row.role.into(),
            row.status.into(),
            row.access_level.into(),
            row.contact_methods.into(),
            row.created_at.into(),
            row.updated_at.into(),
        ];

        self.sql
            .exec(
                "INSERT OR REPLACE INTO subscriptions (
                    subscription_id, labour_id, subscriber_name, subscriber_id, role, status, access_level,
                    contact_methods, created_at, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                Some(bindings),
            )
            .context("Failed to overwrite subscription")?;

        Ok(())
    }
}
