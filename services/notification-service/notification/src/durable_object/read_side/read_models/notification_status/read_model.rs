use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use fern_labour_event_sourcing_rs::Cursor;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationStatus {
    pub notification_id: Uuid,
    pub user_id: String,
    pub status: String,
    pub updated_at: DateTime<Utc>,
}

impl NotificationStatus {
    pub fn new(notification_id: Uuid, user_id: String, created_at: DateTime<Utc>) -> Self {
        Self {
            notification_id,
            user_id,
            status: "REQUESTED".to_string(),
            updated_at: created_at,
        }
    }
}

impl Cursor for NotificationStatus {
    fn id(&self) -> Uuid {
        self.notification_id
    }

    fn updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}

#[derive(Debug, Deserialize)]
pub struct NotificationStatusRow {
    pub notification_id: String,
    pub user_id: String,
    pub status: String,
    pub updated_at: String,
}

impl NotificationStatusRow {
    pub fn into_read_model(self) -> Result<NotificationStatus> {
        Ok(NotificationStatus {
            notification_id: Uuid::parse_str(&self.notification_id)
                .map_err(|e| anyhow!("Invalid notification_id UUID: {}", e))?,
            user_id: self.user_id,
            status: self.status,
            updated_at: Self::parse_timestamp(&self.updated_at)?,
        })
    }

    fn parse_timestamp(timestamp: &str) -> Result<DateTime<Utc>> {
        let datetime = DateTime::parse_from_rfc3339(timestamp)
            .map_err(|e| anyhow!("Invalid timestamp: {}", e))?
            .with_timezone(&Utc);
        Ok(datetime)
    }
}
