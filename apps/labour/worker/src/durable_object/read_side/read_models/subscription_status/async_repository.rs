use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use fern_labour_event_sourcing_rs::{
    AsyncRepositoryTrait, AsyncRepositoryUserTrait, DecodedCursor,
};
use uuid::Uuid;
use worker::D1Database;

use super::read_model::{SubscriptionStatusReadModel, SubscriptionStatusRow};
use crate::durable_object::read_side::read_models::d1_helpers::PaginatedQueryBuilder;

#[async_trait(?Send)]
pub trait SubscriptionStatusRepositoryTrait:
    AsyncRepositoryTrait<SubscriptionStatusReadModel>
    + AsyncRepositoryUserTrait<SubscriptionStatusReadModel>
{
    async fn delete_by_labour_id(&self, labour_id: Uuid) -> Result<()>;
}

pub struct D1SubscriptionStatusRepository {
    db: D1Database,
}

impl D1SubscriptionStatusRepository {
    pub fn create(db: D1Database) -> Self {
        Self { db }
    }
}

#[async_trait(?Send)]
impl AsyncRepositoryTrait<SubscriptionStatusReadModel> for D1SubscriptionStatusRepository {
    async fn get_by_id(&self, subscription_id: Uuid) -> Result<SubscriptionStatusReadModel> {
        let result: Option<SubscriptionStatusRow> = self
            .db
            .prepare("SELECT * FROM subscription_status WHERE subscription_id = ?1")
            .bind(&[subscription_id.to_string().into()])
            .context("Failed to prepare subscription status query")?
            .first(None)
            .await
            .context("Failed to fetch subscription status")?;

        match result {
            Some(row) => row.into_read_model(),
            None => Err(anyhow!("Labour status not found")),
        }
    }

    async fn get(
        &self,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<SubscriptionStatusReadModel>> {
        let (query, bindings) = PaginatedQueryBuilder::with_id_column(
            "SELECT * FROM subscription_status WHERE 1=1",
            "subscription_id",
        )
        .apply_cursor(cursor)
        .apply_limit(limit)
        .build();

        let rows: Vec<SubscriptionStatusRow> = self
            .db
            .prepare(query)
            .bind(&bindings)
            .context("Failed to bind parameters")?
            .all()
            .await
            .context("Failed to fetch subscription status")?
            .results()
            .context("Failed to parse subscription status results")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    async fn upsert(&self, labour: &SubscriptionStatusReadModel) -> Result<()> {
        self.db
            .prepare(
                "INSERT INTO subscription_status (
                    subscription_id, labour_id, subscriber_id, status, created_at, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                 ON CONFLICT(subscription_id, labour_id, subscriber_id)
                 DO UPDATE SET
                    status = ?4,
                    updated_at = ?6",
            )
            .bind(&[
                labour.subscription_id.to_string().into(),
                labour.labour_id.to_string().into(),
                labour.subscriber_id.clone().into(),
                labour.status.to_string().into(),
                labour.created_at.to_rfc3339().into(),
                labour.updated_at.to_rfc3339().into(),
            ])
            .context("Failed to prepare subscription status upsert")?
            .run()
            .await
            .context("Failed to upsert subscription status")?;

        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        match self
            .db
            .prepare(
                "DELETE FROM subscription_status
                 WHERE subscription_id = ?1;",
            )
            .bind(&[id.to_string().into()])
            .context("Failed to prepare subscription status query")?
            .run()
            .await
            .context("Failed to delete subscription status")
        {
            Ok(_) => Ok(()),
            Err(err) => Err(anyhow!(err.to_string())),
        }
    }

    async fn overwrite(&self, labour: &SubscriptionStatusReadModel) -> Result<()> {
        self.db
            .prepare(
                "INSERT OR REPLACE INTO subscription_status (
                    subscription_id, labour_id, subscriber_id, status, created_at, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            )
            .bind(&[
                labour.subscription_id.to_string().into(),
                labour.labour_id.to_string().into(),
                labour.subscriber_id.clone().into(),
                labour.status.to_string().into(),
                labour.created_at.to_rfc3339().into(),
                labour.updated_at.to_rfc3339().into(),
            ])
            .context("Failed to prepare subscription status overwrite")?
            .run()
            .await
            .context("Failed to overwrite subscription status")?;

        Ok(())
    }
}

#[async_trait(?Send)]
impl AsyncRepositoryUserTrait<SubscriptionStatusReadModel> for D1SubscriptionStatusRepository {
    async fn get_by_user_id(
        &self,
        user_id: String,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<SubscriptionStatusReadModel>> {
        let (query, bindings) = PaginatedQueryBuilder::with_id_column(
            "SELECT * FROM subscription_status WHERE subscriber_id = ?1 AND status in ('SUBSCRIBED', 'REQUESTED')",
            "subscription_id",
        )
        .with_binding(user_id.into())
        .apply_cursor(cursor)
        .apply_limit(limit)
        .build();

        let rows: Vec<SubscriptionStatusRow> = self
            .db
            .prepare(query)
            .bind(&bindings)
            .context("Failed to bind parameters")?
            .all()
            .await
            .context("Failed to fetch subscription status")?
            .results()
            .context("Failed to parse subscription status results")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }
}

#[async_trait(?Send)]
impl SubscriptionStatusRepositoryTrait for D1SubscriptionStatusRepository {
    async fn delete_by_labour_id(&self, labour_id: Uuid) -> Result<()> {
        self.db
            .prepare("DELETE FROM subscription_status WHERE labour_id = ?1")
            .bind(&[labour_id.to_string().into()])
            .context("Failed to prepare delete by labour_id query")?
            .run()
            .await
            .context("Failed to delete subscription status by labour_id")?;

        Ok(())
    }
}
