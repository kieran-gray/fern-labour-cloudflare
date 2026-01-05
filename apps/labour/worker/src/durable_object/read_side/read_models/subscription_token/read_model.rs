use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionTokenReadModel {
    pub labour_id: Uuid,
    pub token: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl SubscriptionTokenReadModel {
    pub fn new(labour_id: Uuid, token: String, created_at: DateTime<Utc>) -> Self {
        Self {
            labour_id,
            token,
            created_at,
            updated_at: created_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubscriptionTokenRow {
    pub labour_id: String,
    pub token: String,
    pub created_at: String,
    pub updated_at: String,
}

impl SubscriptionTokenRow {
    pub fn into_read_model(self) -> Result<SubscriptionTokenReadModel> {
        Ok(SubscriptionTokenReadModel {
            labour_id: Uuid::parse_str(&self.labour_id)
                .map_err(|e| anyhow!("Invalid labour_id UUID: {}", e))?,
            token: self.token,
            created_at: Self::parse_timestamp(&self.created_at)?,
            updated_at: Self::parse_timestamp(&self.updated_at)?,
        })
    }

    pub fn from_read_model(model: &SubscriptionTokenReadModel) -> Result<Self> {
        Ok(Self {
            labour_id: model.labour_id.to_string(),
            token: model.token.clone(),
            created_at: model.created_at.to_rfc3339(),
            updated_at: model.updated_at.to_rfc3339(),
        })
    }

    fn parse_timestamp(timestamp: &str) -> Result<DateTime<Utc>> {
        let datetime = DateTime::parse_from_rfc3339(timestamp)
            .map_err(|e| anyhow!("Invalid timestamp: {}", e))?
            .with_timezone(&Utc);
        Ok(datetime)
    }
}
