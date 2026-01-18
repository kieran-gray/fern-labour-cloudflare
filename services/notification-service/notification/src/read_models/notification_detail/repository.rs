use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use fern_labour_event_sourcing_rs::{AsyncRepositoryTrait, DecodedCursor};
use uuid::Uuid;
use worker::{D1Database, wasm_bindgen::JsValue};

use crate::read_models::notification_detail::read_model::{
    NotificationDetail, NotificationDetailRow,
};

pub struct D1NotificationDetailRepository {
    db: D1Database,
}

#[async_trait(?Send)]
pub trait NotificationExternalIdTrait {
    async fn get_by_external_id(&self, external_id: String) -> Result<NotificationDetail>;
}

pub trait NotificationDetailRepositoryTrait:
    NotificationExternalIdTrait + AsyncRepositoryTrait<NotificationDetail>
{
}

impl D1NotificationDetailRepository {
    pub fn create(db: D1Database) -> Self {
        Self { db }
    }
}

#[async_trait(?Send)]
impl AsyncRepositoryTrait<NotificationDetail> for D1NotificationDetailRepository {
    async fn get_by_id(&self, notification_id: Uuid) -> Result<NotificationDetail> {
        let result: Option<NotificationDetailRow> = self
            .db
            .prepare("SELECT * FROM notification_details WHERE notification_id = ?1")
            .bind(&[notification_id.to_string().into()])
            .context("Failed to prepare notification detail query")?
            .first(None)
            .await
            .context("Failed to fetch notification detail")?;

        match result {
            Some(row) => row.into_read_model(),
            None => Err(anyhow!("Notification not found")),
        }
    }

    async fn get(
        &self,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<NotificationDetail>> {
        let mut query = "SELECT * FROM notification_detail".to_string();
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

        let rows: Vec<NotificationDetailRow> = statement
            .all()
            .await
            .context("Failed to fetch notification detail")?
            .results()
            .context("Failed to parse notification detail results")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    async fn upsert(&self, notification: &NotificationDetail) -> Result<()> {
        let row = NotificationDetailRow::from_read_model(notification)
            .context("Failed to convert notification to row")?;

        self.db
            .prepare(
                "INSERT INTO notification_details (
                    notification_id, user_id, status, channel, destination, template,
                    rendered_content, external_id, created_at, updated_at,
                    dispatched_at, delivered_at, failed_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
                 ON CONFLICT(notification_id)
                 DO UPDATE SET
                    status = ?3,
                    rendered_content = ?7,
                    external_id = ?8,
                    updated_at = ?10,
                    dispatched_at = ?11,
                    delivered_at = ?12,
                    failed_at = ?13",
            )
            .bind(&[
                row.notification_id.into(),
                row.user_id.into(),
                row.status.into(),
                row.channel.into(),
                row.destination.into(),
                row.template.into(),
                option_string_to_jsvalue(row.rendered_content),
                option_string_to_jsvalue(row.external_id),
                row.created_at.into(),
                row.updated_at.into(),
                option_string_to_jsvalue(row.dispatched_at),
                option_string_to_jsvalue(row.delivered_at),
                option_string_to_jsvalue(row.failed_at),
            ])
            .context("Failed to prepare notification upsert")?
            .run()
            .await
            .context("Failed to upsert notification")?;

        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        match self
            .db
            .prepare(
                "DELETE FROM notification_details
                 WHERE notification_id = ?1;",
            )
            .bind(&[id.to_string().into()])
            .context("Failed to prepare notification detail query")?
            .run()
            .await
            .context("Failed to delete notification detail")
        {
            Ok(_) => Ok(()),
            Err(err) => Err(anyhow!(err.to_string())),
        }
    }

    async fn overwrite(&self, notification: &NotificationDetail) -> Result<()> {
        let row = NotificationDetailRow::from_read_model(notification)
            .context("Failed to convert notification to row")?;

        self.db
            .prepare(
                "INSERT OR REPLACE INTO notification_details (
                    notification_id, user_id, status, channel, destination, template,
                    rendered_content, external_id, created_at, updated_at,
                    dispatched_at, delivered_at, failed_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            )
            .bind(&[
                row.notification_id.into(),
                row.user_id.into(),
                row.status.into(),
                row.channel.into(),
                row.destination.into(),
                row.template.into(),
                option_string_to_jsvalue(row.rendered_content),
                option_string_to_jsvalue(row.external_id),
                row.created_at.into(),
                row.updated_at.into(),
                option_string_to_jsvalue(row.dispatched_at),
                option_string_to_jsvalue(row.delivered_at),
                option_string_to_jsvalue(row.failed_at),
            ])
            .context("Failed to prepare notification overwrite")?
            .run()
            .await
            .context("Failed to overwrite notification")?;

        Ok(())
    }
}

#[async_trait(?Send)]
impl NotificationExternalIdTrait for D1NotificationDetailRepository {
    async fn get_by_external_id(&self, external_id: String) -> Result<NotificationDetail> {
        let result: Option<NotificationDetailRow> = self
            .db
            .prepare("SELECT * FROM notification_details WHERE external_id = ?1")
            .bind(&[external_id.into()])
            .context("Failed to prepare notification detail query")?
            .first(None)
            .await
            .context("Failed to fetch notification detail")?;

        match result {
            Some(row) => row.into_read_model(),
            None => Err(anyhow!("Notification not found")),
        }
    }
}

impl NotificationDetailRepositoryTrait for D1NotificationDetailRepository {}

fn option_string_to_jsvalue(opt: Option<String>) -> JsValue {
    match opt {
        Some(val) => val.into(),
        None => JsValue::NULL,
    }
}
