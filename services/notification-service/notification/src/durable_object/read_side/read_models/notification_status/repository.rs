use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use fern_labour_event_sourcing_rs::{AsyncRepositoryTrait, DecodedCursor};
use uuid::Uuid;
use worker::D1Database;

use crate::durable_object::read_side::read_models::{
    NotificationStatus, notification_status::read_model::NotificationStatusRow,
};

#[async_trait(?Send)]
pub trait NotificationStatusRepositoryDeletedTrait {
    async fn get_deleted(&self) -> Result<Vec<NotificationStatus>>;
}

pub trait NotificationStatusRepositoryTrait:
    AsyncRepositoryTrait<NotificationStatus> + NotificationStatusRepositoryDeletedTrait
{
}

pub struct D1NotificationStatusRepository {
    db: D1Database,
}

impl D1NotificationStatusRepository {
    pub fn create(db: D1Database) -> Self {
        Self { db }
    }
}

#[async_trait(?Send)]
impl AsyncRepositoryTrait<NotificationStatus> for D1NotificationStatusRepository {
    async fn get_by_id(&self, notification_id: Uuid) -> Result<NotificationStatus> {
        let result: Option<NotificationStatusRow> = self
            .db
            .prepare("SELECT * FROM notification_status WHERE notification_id = ?1")
            .bind(&[notification_id.to_string().into()])
            .context("Failed to prepare notification status query")?
            .first(None)
            .await
            .context("Failed to fetch notification status")?;

        match result {
            Some(row) => row.into_read_model(),
            None => Err(anyhow!("Notification status not found")),
        }
    }

    async fn get(
        &self,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<NotificationStatus>> {
        let mut query = "SELECT * FROM notification_status".to_string();
        let mut bindings = vec![];

        if let Some(cur) = cursor {
            query.push_str(" WHERE updated_at < ?1 OR (updated_at = ?1 AND notification_id < ?2)");
            bindings.push(cur.last_updated_at.to_rfc3339().into());
            bindings.push(cur.last_id.to_string().into());
        }

        let limit_param_index = bindings.len() + 1;
        query.push_str(&format!(
            " ORDER BY updated_at DESC, notification_id DESC LIMIT ?{}",
            limit_param_index
        ));

        let plus_one_limit = limit + 1;
        bindings.push((plus_one_limit as f64).into());

        let statement = self
            .db
            .prepare(query)
            .bind(&bindings)
            .context("Failed to bind parameters")?;

        let rows: Vec<NotificationStatusRow> = statement
            .all()
            .await
            .context("Failed to fetch notification status")?
            .results()
            .context("Failed to parse notification status results")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    async fn upsert(&self, notification: &NotificationStatus) -> Result<()> {
        self.db
            .prepare(
                "INSERT INTO notification_status (
                    notification_id, user_id, status, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(notification_id)
                 DO UPDATE SET status = ?3, updated_at = ?4",
            )
            .bind(&[
                notification.notification_id.to_string().into(),
                notification.user_id.clone().into(),
                notification.status.clone().into(),
                notification.updated_at.to_rfc3339().into(),
            ])
            .context("Failed to prepare notification status upsert")?
            .run()
            .await
            .context("Failed to upsert notification status")?;

        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        match self
            .db
            .prepare(
                "DELETE FROM notification_status
                 WHERE notification_id = ?1;",
            )
            .bind(&[id.to_string().into()])
            .context("Failed to prepare notification status query")?
            .run()
            .await
            .context("Failed to delete notification status")
        {
            Ok(_) => Ok(()),
            Err(err) => Err(anyhow!(err.to_string())),
        }
    }

    async fn overwrite(&self, notification: &NotificationStatus) -> Result<()> {
        self.db
            .prepare(
                "INSERT OR REPLACE INTO notification_status (
                    notification_id, user_id, status, updated_at
                 )
                 VALUES (?1, ?2, ?3, ?4)",
            )
            .bind(&[
                notification.notification_id.to_string().into(),
                notification.user_id.clone().into(),
                notification.status.clone().into(),
                notification.updated_at.to_rfc3339().into(),
            ])
            .context("Failed to prepare notification status overwrite")?
            .run()
            .await
            .context("Failed to overwrite notification status")?;

        Ok(())
    }
}

#[async_trait(?Send)]
impl NotificationStatusRepositoryDeletedTrait for D1NotificationStatusRepository {
    async fn get_deleted(&self) -> Result<Vec<NotificationStatus>> {
        let rows: Vec<NotificationStatusRow> = self
            .db
            .prepare("SELECT * FROM notification_status WHERE status='DELETED'")
            .all()
            .await
            .map_err(|e| anyhow!("Failed to query deleted notifications: {e}"))?
            .results()
            .map_err(|e| anyhow!("Failed to parse notification query results: {e}"))?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }
}

impl NotificationStatusRepositoryTrait for D1NotificationStatusRepository {}
