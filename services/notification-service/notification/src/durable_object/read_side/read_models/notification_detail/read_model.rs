use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use fern_labour_event_sourcing_rs::Cursor;
use fern_labour_notifications_shared::value_objects::RenderedContent;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationDetail {
    pub notification_id: Uuid,
    pub user_id: String,
    pub status: String,
    pub channel: String,
    pub destination: String,
    pub template: String,
    pub rendered_content: Option<RenderedContent>,
    pub external_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub dispatched_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub failed_at: Option<DateTime<Utc>>,
}

impl NotificationDetail {
    pub fn new(
        notification_id: Uuid,
        user_id: String,
        channel: String,
        destination: String,
        template: String,
        created_at: DateTime<Utc>,
    ) -> Self {
        Self {
            notification_id,
            user_id,
            status: "REQUESTED".to_string(),
            channel,
            destination,
            template,
            rendered_content: None,
            external_id: None,
            created_at,
            updated_at: created_at,
            dispatched_at: None,
            delivered_at: None,
            failed_at: None,
        }
    }
}

impl Cursor for NotificationDetail {
    fn id(&self) -> Uuid {
        self.notification_id
    }

    fn updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationDetailRow {
    pub notification_id: String,
    pub user_id: String,
    pub status: String,
    pub channel: String,
    pub destination: String,
    pub template: String,
    pub rendered_content: Option<String>,
    pub external_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub dispatched_at: Option<String>,
    pub delivered_at: Option<String>,
    pub failed_at: Option<String>,
}

impl NotificationDetailRow {
    pub fn into_read_model(self) -> Result<NotificationDetail> {
        Ok(NotificationDetail {
            notification_id: Uuid::parse_str(&self.notification_id)
                .map_err(|e| anyhow!("Invalid notification_id UUID: {}", e))?,
            user_id: self.user_id,
            status: self.status,
            channel: self.channel,
            destination: self.destination,
            template: self.template,
            rendered_content: Self::parse_rendered_content(self.rendered_content)?,
            external_id: self.external_id,
            created_at: Self::parse_timestamp(&self.created_at)?,
            updated_at: Self::parse_timestamp(&self.updated_at)?,
            dispatched_at: Self::parse_optional_timestamp(self.dispatched_at)?,
            delivered_at: Self::parse_optional_timestamp(self.delivered_at)?,
            failed_at: Self::parse_optional_timestamp(self.failed_at)?,
        })
    }

    pub fn from_read_model(model: &NotificationDetail) -> Result<Self> {
        Ok(Self {
            notification_id: model.notification_id.to_string(),
            user_id: model.user_id.clone(),
            status: model.status.clone(),
            channel: model.channel.clone(),
            destination: model.destination.clone(),
            template: model.template.clone(),
            rendered_content: Self::serialize_rendered_content(&model.rendered_content)?,
            external_id: model.external_id.clone(),
            created_at: model.created_at.to_rfc3339(),
            updated_at: model.updated_at.to_rfc3339(),
            dispatched_at: model.dispatched_at.map(|dt| dt.to_rfc3339()),
            delivered_at: model.delivered_at.map(|dt| dt.to_rfc3339()),
            failed_at: model.failed_at.map(|dt| dt.to_rfc3339()),
        })
    }

    fn parse_rendered_content(json: Option<String>) -> Result<Option<RenderedContent>> {
        match json {
            Some(json_str) => {
                let content = serde_json::from_str::<RenderedContent>(&json_str)
                    .map_err(|e| anyhow!("Invalid rendered_content JSON: {}", e))?;
                Ok(Some(content))
            }
            None => Ok(None),
        }
    }

    fn serialize_rendered_content(content: &Option<RenderedContent>) -> Result<Option<String>> {
        match content {
            Some(content) => {
                let json_str = serde_json::to_string(content)
                    .map_err(|e| anyhow!("Failed to serialize rendered_content: {}", e))?;
                Ok(Some(json_str))
            }
            None => Ok(None),
        }
    }

    fn parse_timestamp(timestamp: &str) -> Result<DateTime<Utc>> {
        let datetime = DateTime::parse_from_rfc3339(timestamp)
            .map_err(|e| anyhow!("Invalid timestamp: {}", e))?
            .with_timezone(&Utc);
        Ok(datetime)
    }

    fn parse_optional_timestamp(timestamp: Option<String>) -> Result<Option<DateTime<Utc>>> {
        match timestamp {
            Some(timestamp) => {
                let parsed_timestamp = Self::parse_timestamp(&timestamp)?;
                Ok(Some(parsed_timestamp))
            }
            _ => Ok(None),
        }
    }
}
