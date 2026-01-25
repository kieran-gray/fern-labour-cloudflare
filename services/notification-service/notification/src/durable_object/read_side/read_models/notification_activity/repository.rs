use anyhow::{Context, Result};
use async_trait::async_trait;
use chrono::NaiveDate;
use worker::D1Database;

use crate::durable_object::read_side::read_models::{
    NotificationActivity, notification_activity::read_model::NotificationActivityRow,
};

#[async_trait(?Send)]
pub trait NotificationActivityRepositoryTrait {
    async fn get(&self, limit: usize) -> Result<Vec<NotificationActivity>>;
    async fn increment(&self, date: NaiveDate) -> Result<()>;
    async fn upsert(&self, activity: &NotificationActivity) -> Result<()>;
}

pub struct D1NotificationActivityRepository {
    db: D1Database,
}

impl D1NotificationActivityRepository {
    pub fn create(db: D1Database) -> Self {
        Self { db }
    }
}

#[async_trait(?Send)]
impl NotificationActivityRepositoryTrait for D1NotificationActivityRepository {
    async fn get(&self, limit: usize) -> Result<Vec<NotificationActivity>> {
        let statement = self
            .db
            .prepare("SELECT * FROM notification_activity ORDER BY date DESC LIMIT ?1")
            .bind(&[(limit as f64).into()])
            .context("Failed to bind parameters")?;

        let rows: Vec<NotificationActivityRow> = statement
            .all()
            .await
            .context("Failed to fetch notification activity")?
            .results()
            .context("Failed to parse notification activity results")?;

        rows.into_iter().map(|row| row.into_read_model()).collect()
    }

    async fn increment(&self, date: NaiveDate) -> Result<()> {
        let date_str = date.format("%Y-%m-%d").to_string();

        self.db
            .prepare(
                "INSERT INTO notification_activity (count, date)
                   VALUES (1, ?1)
                   ON CONFLICT(date)
                   DO UPDATE SET count = count + 1",
            )
            .bind(&[date_str.into()])
            .context("Failed to prepare activity increment")?
            .run()
            .await
            .context("Failed to increment activity count")?;

        Ok(())
    }

    async fn upsert(&self, activity: &NotificationActivity) -> Result<()> {
        let date_str = activity.date.format("%Y-%m-%d").to_string();

        self.db
            .prepare(
                "INSERT INTO notification_activity (count, date)
                 VALUES (?1, ?2)
                 ON CONFLICT(date)
                 DO UPDATE SET count = EXCLUDED.count",
            )
            .bind(&[(activity.count as f64).into(), date_str.into()])
            .context("Failed to prepare notification activity upsert")?
            .run()
            .await
            .context("Failed to upsert notification activity")?;

        Ok(())
    }
}
