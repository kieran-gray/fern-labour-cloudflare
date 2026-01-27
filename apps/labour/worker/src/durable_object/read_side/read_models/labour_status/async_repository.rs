use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use chrono::Utc;
use fern_labour_event_sourcing_rs::{
    AsyncRepositoryTrait, AsyncRepositoryUserTrait, DecodedCursor,
};
use serde::Deserialize;
use uuid::Uuid;
use worker::{D1Database, wasm_bindgen::JsValue};

use super::read_model::{LabourStatusReadModel, LabourStatusRow};
use crate::durable_object::read_side::read_models::d1_helpers::{
    PaginatedQueryBuilder, option_datetime_to_jsvalue, option_string_to_jsvalue,
};

#[async_trait(?Send)]
pub trait LabourStatusRepositoryTrait:
    AsyncRepositoryTrait<LabourStatusReadModel> + AsyncRepositoryUserTrait<LabourStatusReadModel>
{
    async fn get_active_labour(&self, user_id: String) -> Result<Option<LabourStatusReadModel>>;
    async fn get_by_ids(&self, labour_ids: Vec<Uuid>) -> Result<Vec<LabourStatusReadModel>>;
    async fn get_pending_cleanup_ids(&self) -> Result<Vec<Uuid>>;
    async fn mark_do_cleaned_up(&self, labour_id: Uuid) -> Result<()>;
}

pub struct D1LabourStatusRepository {
    db: D1Database,
}

impl D1LabourStatusRepository {
    pub fn create(db: D1Database) -> Self {
        Self { db }
    }
}

fn model_to_bindings(labour: &LabourStatusReadModel) -> [JsValue; 9] {
    [
        labour.labour_id.to_string().into(),
        labour.mother_id.clone().into(),
        labour.mother_name.clone().into(),
        labour.current_phase.to_string().into(),
        option_string_to_jsvalue(labour.labour_name.as_ref()),
        labour.created_at.to_rfc3339().into(),
        labour.updated_at.to_rfc3339().into(),
        option_datetime_to_jsvalue(labour.deleted_at),
        option_datetime_to_jsvalue(labour.do_cleaned_up_at),
    ]
}

fn rows_to_read_models(rows: Vec<LabourStatusRow>) -> Result<Vec<LabourStatusReadModel>> {
    rows.into_iter().map(|row| row.into_read_model()).collect()
}

#[async_trait(?Send)]
impl AsyncRepositoryTrait<LabourStatusReadModel> for D1LabourStatusRepository {
    async fn get_by_id(&self, labour_id: Uuid) -> Result<LabourStatusReadModel> {
        let result: Option<LabourStatusRow> = self
            .db
            .prepare("SELECT * FROM labour_status WHERE labour_id = ?1")
            .bind(&[labour_id.to_string().into()])
            .context("Failed to prepare labour status query")?
            .first(None)
            .await
            .context("Failed to fetch labour status")?;

        match result {
            Some(row) => row.into_read_model(),
            None => Err(anyhow!("Labour status not found")),
        }
    }

    async fn get(
        &self,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<LabourStatusReadModel>> {
        let (query, bindings) =
            PaginatedQueryBuilder::new("SELECT * FROM labour_status WHERE deleted_at IS NULL")
                .apply_cursor(cursor)
                .apply_limit(limit)
                .build();

        let rows: Vec<LabourStatusRow> = self
            .db
            .prepare(query)
            .bind(&bindings)
            .context("Failed to bind parameters")?
            .all()
            .await
            .context("Failed to fetch labour status")?
            .results()
            .context("Failed to parse labour status results")?;

        rows_to_read_models(rows)
    }

    async fn upsert(&self, labour: &LabourStatusReadModel) -> Result<()> {
        self.db
            .prepare(
                "INSERT INTO labour_status (
                    labour_id, mother_id, mother_name, current_phase, labour_name,
                    created_at, updated_at, deleted_at, do_cleaned_up_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
                 ON CONFLICT(labour_id)
                 DO UPDATE SET
                    current_phase = ?4,
                    labour_name = ?5,
                    updated_at = ?7,
                    deleted_at = ?8,
                    do_cleaned_up_at = ?9",
            )
            .bind(&model_to_bindings(labour))
            .context("Failed to prepare labour status upsert")?
            .run()
            .await
            .context("Failed to upsert labour status")?;

        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        match self
            .db
            .prepare(
                "DELETE FROM labour_status
                 WHERE labour_id = ?1;",
            )
            .bind(&[id.to_string().into()])
            .context("Failed to prepare labour status query")?
            .run()
            .await
            .context("Failed to delete labour status")
        {
            Ok(_) => Ok(()),
            Err(err) => Err(anyhow!(err.to_string())),
        }
    }

    async fn overwrite(&self, labour: &LabourStatusReadModel) -> Result<()> {
        self.db
            .prepare(
                "INSERT OR REPLACE INTO labour_status (
                    labour_id, mother_id, mother_name, current_phase, labour_name,
                    created_at, updated_at, deleted_at, do_cleaned_up_at
                 )
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            )
            .bind(&model_to_bindings(labour))
            .context("Failed to prepare labour status overwrite")?
            .run()
            .await
            .context("Failed to overwrite labour status")?;

        Ok(())
    }
}

#[async_trait(?Send)]
impl AsyncRepositoryUserTrait<LabourStatusReadModel> for D1LabourStatusRepository {
    async fn get_by_user_id(
        &self,
        user_id: String,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<LabourStatusReadModel>> {
        let (query, bindings) = PaginatedQueryBuilder::new(
            "SELECT * FROM labour_status WHERE mother_id = ?1 AND deleted_at IS NULL",
        )
        .with_binding(user_id.into())
        .apply_cursor(cursor)
        .apply_limit(limit)
        .build();

        let rows: Vec<LabourStatusRow> = self
            .db
            .prepare(query)
            .bind(&bindings)
            .context("Failed to bind parameters")?
            .all()
            .await
            .context("Failed to fetch labour status")?
            .results()
            .context("Failed to parse labour status results")?;

        rows_to_read_models(rows)
    }
}

#[async_trait(?Send)]
impl LabourStatusRepositoryTrait for D1LabourStatusRepository {
    async fn get_active_labour(&self, user_id: String) -> Result<Option<LabourStatusReadModel>> {
        let result: Option<LabourStatusRow> = self
            .db
            .prepare(
                "SELECT * FROM labour_status
                 WHERE mother_id = ?1 AND current_phase != 'COMPLETE' AND deleted_at IS NULL",
            )
            .bind(&[user_id.to_string().into()])
            .context("Failed to prepare active labour query")?
            .first(None)
            .await
            .context("Failed to fetch active labour")?;

        match result {
            Some(row) => Ok(Some(row.into_read_model()?)),
            None => Ok(None),
        }
    }

    async fn get_by_ids(&self, labour_ids: Vec<Uuid>) -> Result<Vec<LabourStatusReadModel>> {
        if labour_ids.is_empty() {
            return Ok(vec![]);
        }

        let placeholders: Vec<String> = (1..=labour_ids.len()).map(|i| format!("?{}", i)).collect();
        let query = format!(
            "SELECT * FROM labour_status WHERE labour_id IN ({}) AND deleted_at IS NULL",
            placeholders.join(", ")
        );

        let bindings: Vec<worker::wasm_bindgen::JsValue> =
            labour_ids.iter().map(|id| id.to_string().into()).collect();

        let statement = self
            .db
            .prepare(query)
            .bind(&bindings)
            .context("Failed to bind parameters")?;

        let rows: Vec<LabourStatusRow> = statement
            .all()
            .await
            .context("Failed to fetch labour status")?
            .results()
            .context("Failed to parse labour status results")?;

        rows_to_read_models(rows)
    }

    async fn get_pending_cleanup_ids(&self) -> Result<Vec<Uuid>> {
        #[derive(Deserialize)]
        struct LabourIdRow {
            pub labour_id: String,
        }

        let rows: Vec<LabourIdRow> = self
            .db
            .prepare(
                "SELECT labour_id FROM labour_status
                 WHERE deleted_at IS NOT NULL AND do_cleaned_up_at IS NULL",
            )
            .all()
            .await
            .context("Failed to fetch pending cleanup IDs")?
            .results()
            .context("Failed to parse pending cleanup IDs")?;

        rows.into_iter()
            .map(|row| {
                Uuid::parse_str(&row.labour_id)
                    .context(format!("Invalid labour_id UUID: {}", row.labour_id))
            })
            .collect()
    }

    async fn mark_do_cleaned_up(&self, labour_id: Uuid) -> Result<()> {
        let now = Utc::now();
        self.db
            .prepare("UPDATE labour_status SET do_cleaned_up_at = ?1 WHERE labour_id = ?2")
            .bind(&[now.to_rfc3339().into(), labour_id.to_string().into()])
            .context("Failed to prepare mark DO cleaned up query")?
            .run()
            .await
            .context("Failed to mark DO as cleaned up")?;

        Ok(())
    }
}
