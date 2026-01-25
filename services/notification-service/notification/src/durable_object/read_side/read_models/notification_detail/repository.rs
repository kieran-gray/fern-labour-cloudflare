use anyhow::{Result, anyhow};
use async_trait::async_trait;
use fern_labour_event_sourcing_rs::{AsyncRepositoryTrait, DecodedCursor};
use serde::Deserialize;
use uuid::Uuid;
use worker::{D1Database, wasm_bindgen::JsValue};

use crate::durable_object::read_side::read_models::{
    NotificationDetail, notification_detail::read_model::NotificationDetailRow,
};

#[async_trait(?Send)]
pub trait NotificationDetailRepositoryDeletedTrait {
    async fn get_deleted_ids(&self) -> Result<Vec<Uuid>>;
}

pub struct D1NotificationDetailRepository {
    db: D1Database,
}

#[async_trait(?Send)]
pub trait NotificationExternalIdTrait {
    async fn get_by_external_id(&self, external_id: String) -> Result<NotificationDetail>;
}

pub trait NotificationDetailRepositoryTrait:
    NotificationExternalIdTrait
    + AsyncRepositoryTrait<NotificationDetail>
    + NotificationDetailRepositoryDeletedTrait
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
            .map_err(|e| anyhow!("Failed to prepare notification detail query: {e}"))?
            .first(None)
            .await
            .map_err(|e| anyhow!("Failed to fetch notification detail: {e}"))?;

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
            .map_err(|e| anyhow!("Failed to bind parameters: {e}"))?;

        let rows: Vec<NotificationDetailRow> = statement
            .all()
            .await
            .map_err(|e| anyhow!("Failed to fetch notification detail: {e}"))?
            .results()
            .map_err(|e| anyhow!("Failed to parse notification detail results: {e}"))?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    async fn upsert(&self, notification: &NotificationDetail) -> Result<()> {
        let row = NotificationDetailRow::from_read_model(notification)
            .map_err(|e| anyhow!("Failed to convert notification to row: {e}"))?;

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
            .map_err(|e| anyhow!("Failed to prepare notification upsert: {e}"))?
            .run()
            .await
            .map_err(|e| anyhow!("Failed to upsert notification: {e}"))?;

        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        self.db
            .prepare("DELETE FROM notification_details WHERE notification_id = ?1;")
            .bind(&[id.to_string().into()])
            .map_err(|e| anyhow!("Failed to prepare notification detail query: {e}"))?
            .run()
            .await
            .map_err(|e| anyhow!("Failed to delete notification detail: {e}"))?;
        Ok(())
    }

    async fn overwrite(&self, notification: &NotificationDetail) -> Result<()> {
        let row = NotificationDetailRow::from_read_model(notification)
            .map_err(|e| anyhow!("Failed to convert notification to row: {e}"))?;

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
            .map_err(|e| anyhow!("Failed to prepare notification overwrite: {e}"))?
            .run()
            .await
            .map_err(|e| anyhow!("Failed to overwrite notification: {e}"))?;

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
            .map_err(|e| anyhow!("Failed to prepare notification detail query: {e}"))?
            .first(None)
            .await
            .map_err(|e| anyhow!("Failed to fetch notification detail: {e}"))?;

        match result {
            Some(row) => row.into_read_model(),
            None => Err(anyhow!("Notification not found")),
        }
    }
}

#[async_trait(?Send)]
impl NotificationDetailRepositoryDeletedTrait for D1NotificationDetailRepository {
    async fn get_deleted_ids(&self) -> Result<Vec<Uuid>> {
        #[derive(Deserialize)]
        struct NotificationIdRow {
            pub notification_id: String,
        }

        let rows: Vec<NotificationIdRow> = self
            .db
            .prepare("SELECT notification_id FROM notification_details WHERE status='DELETED'")
            .all()
            .await
            .map_err(|e| anyhow!("Failed to fetch deleted ids: {e}"))?
            .results()
            .map_err(|e| anyhow!("Failed to parse deleted ids: {e}"))?;

        Ok(rows
            .into_iter()
            .map(|row| Uuid::parse_str(&row.notification_id).unwrap())
            .collect::<Vec<_>>())
    }
}

impl NotificationDetailRepositoryTrait for D1NotificationDetailRepository {}

fn option_string_to_jsvalue(opt: Option<String>) -> JsValue {
    match opt {
        Some(val) => val.into(),
        None => JsValue::NULL,
    }
}
