use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use fern_labour_event_sourcing_rs::Cursor;
use fern_labour_labour_shared::value_objects::{
    SubscriberAccessLevel, SubscriberContactMethod, SubscriberRole,
    subscriber::status::SubscriberStatus,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionReadModel {
    pub subscription_id: Uuid,
    pub labour_id: Uuid,
    pub subscriber_name: String,
    pub subscriber_id: String,
    pub role: SubscriberRole,
    pub status: SubscriberStatus,
    pub access_level: SubscriberAccessLevel,
    pub contact_methods: Vec<SubscriberContactMethod>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl SubscriptionReadModel {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        subscription_id: Uuid,
        labour_id: Uuid,
        subscriber_name: String,
        subscriber_id: String,
        role: SubscriberRole,
        status: SubscriberStatus,
        access_level: SubscriberAccessLevel,
        contact_methods: Vec<SubscriberContactMethod>,
        created_at: DateTime<Utc>,
    ) -> Self {
        Self {
            subscription_id,
            labour_id,
            subscriber_name,
            subscriber_id,
            role,
            status,
            access_level,
            contact_methods,
            created_at,
            updated_at: created_at,
        }
    }
}

impl Cursor for SubscriptionReadModel {
    fn id(&self) -> Uuid {
        self.subscription_id
    }

    fn updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubscriptionRow {
    pub subscription_id: String,
    pub labour_id: String,
    pub subscriber_name: String,
    pub subscriber_id: String,
    pub role: String,
    pub status: String,
    pub access_level: String,
    pub contact_methods: String,
    pub created_at: String,
    pub updated_at: String,
}

impl SubscriptionRow {
    pub fn into_read_model(self) -> Result<SubscriptionReadModel> {
        Ok(SubscriptionReadModel {
            subscription_id: Uuid::parse_str(&self.subscription_id)
                .map_err(|e| anyhow!("Invalid subscription_id UUID: {}", e))?,
            labour_id: Uuid::parse_str(&self.labour_id)
                .map_err(|e| anyhow!("Invalid labour_id UUID: {}", e))?,
            subscriber_name: self.subscriber_name,
            subscriber_id: self.subscriber_id,
            role: Self::parse_role(&self.role)?,
            status: Self::parse_status(&self.status)?,
            access_level: Self::parse_access_level(&self.access_level)?,
            contact_methods: Self::parse_contact_methods(&self.contact_methods)?,
            created_at: Self::parse_timestamp(&self.created_at)?,
            updated_at: Self::parse_timestamp(&self.updated_at)?,
        })
    }

    pub fn from_read_model(model: &SubscriptionReadModel) -> Result<Self> {
        Ok(Self {
            subscription_id: model.subscription_id.to_string(),
            labour_id: model.labour_id.to_string(),
            subscriber_name: model.subscriber_name.clone(),
            subscriber_id: model.subscriber_id.clone(),
            role: serde_json::to_string(&model.role)
                .map_err(|e| anyhow!("Failed to serialize role: {}", e))?,
            status: serde_json::to_string(&model.status)
                .map_err(|e| anyhow!("Failed to serialize status: {}", e))?,
            access_level: serde_json::to_string(&model.access_level)
                .map_err(|e| anyhow!("Failed to serialize access_level: {}", e))?,
            contact_methods: serde_json::to_string(&model.contact_methods)
                .map_err(|e| anyhow!("Failed to serialize contact_methods: {}", e))?,
            created_at: model.created_at.to_rfc3339(),
            updated_at: model.updated_at.to_rfc3339(),
        })
    }

    fn parse_role(role_str: &str) -> Result<SubscriberRole> {
        serde_json::from_str(role_str)
            .map_err(|e| anyhow!("Invalid role value '{}': {}", role_str, e))
    }

    fn parse_status(status_str: &str) -> Result<SubscriberStatus> {
        serde_json::from_str(status_str)
            .map_err(|e| anyhow!("Invalid status value '{}': {}", status_str, e))
    }

    fn parse_access_level(access_level_str: &str) -> Result<SubscriberAccessLevel> {
        serde_json::from_str(access_level_str)
            .map_err(|e| anyhow!("Invalid access_level value '{}': {}", access_level_str, e))
    }

    fn parse_contact_methods(contact_methods_str: &str) -> Result<Vec<SubscriberContactMethod>> {
        serde_json::from_str(contact_methods_str).map_err(|e| {
            anyhow!(
                "Invalid contact_methods value '{}': {}",
                contact_methods_str,
                e
            )
        })
    }

    fn parse_timestamp(timestamp: &str) -> Result<DateTime<Utc>> {
        let datetime = DateTime::parse_from_rfc3339(timestamp)
            .map_err(|e| anyhow!("Invalid timestamp: {}", e))?
            .with_timezone(&Utc);
        Ok(datetime)
    }
}
