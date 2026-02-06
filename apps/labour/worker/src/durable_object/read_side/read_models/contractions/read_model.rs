use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use fern_labour_event_sourcing_rs::Cursor;
use fern_labour_labour_shared::value_objects::contraction::duration::Duration;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use worker::js_sys::parse_float;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractionReadModel {
    pub labour_id: Uuid,
    pub contraction_id: Uuid,
    pub duration: Duration,
    pub duration_seconds: f64,
    pub intensity: Option<u8>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl ContractionReadModel {
    pub fn new(
        labour_id: Uuid,
        contraction_id: Uuid,
        duration: Duration,
        intensity: Option<u8>,
        created_at: DateTime<Utc>,
    ) -> Self {
        let duration_seconds = &duration.duration_seconds();
        Self {
            labour_id,
            contraction_id,
            duration,
            duration_seconds: *duration_seconds,
            intensity,
            created_at,
            updated_at: created_at,
        }
    }
}

impl Cursor for ContractionReadModel {
    fn id(&self) -> Uuid {
        self.contraction_id
    }

    #[allow(clippy::misnamed_getters)]
    fn updated_at(&self) -> DateTime<Utc> {
        self.duration.start_time().to_owned()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContractionRow {
    pub labour_id: String,
    pub contraction_id: String,
    pub start_time: String,
    pub end_time: String,
    pub duration_seconds: String,
    pub intensity: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl ContractionRow {
    pub fn into_read_model(self) -> Result<ContractionReadModel> {
        let start_time = Self::parse_timestamp(&self.start_time)?;
        let end_time = Self::parse_timestamp(&self.end_time)?;
        let duration = Duration::create(start_time, end_time)
            .map_err(|e| anyhow!("Failed to create duration: {}", e))?;

        Ok(ContractionReadModel {
            labour_id: Uuid::parse_str(&self.labour_id)
                .map_err(|e| anyhow!("Invalid labour_id UUID: {}", e))?,
            contraction_id: Uuid::parse_str(&self.contraction_id)
                .map_err(|e| anyhow!("Invalid contraction_id UUID: {}", e))?,
            duration,
            duration_seconds: parse_float(&self.duration_seconds),
            intensity: Self::parse_optional_intensity(self.intensity)?,
            created_at: Self::parse_timestamp(&self.created_at)?,
            updated_at: Self::parse_timestamp(&self.updated_at)?,
        })
    }

    pub fn from_read_model(model: &ContractionReadModel) -> Result<Self> {
        Ok(Self {
            labour_id: model.labour_id.to_string(),
            contraction_id: model.contraction_id.to_string(),
            start_time: model.duration.start_time().to_rfc3339(),
            end_time: model.duration.end_time().to_rfc3339(),
            duration_seconds: model.duration_seconds.to_string(),
            intensity: model.intensity.map(|i| i.to_string()),
            created_at: model.created_at.to_rfc3339(),
            updated_at: model.updated_at.to_rfc3339(),
        })
    }

    fn parse_optional_intensity(intensity_str: Option<String>) -> Result<Option<u8>> {
        match intensity_str {
            Some(s) => {
                let value = s
                    .parse::<u8>()
                    .map_err(|e| anyhow!("Invalid intensity value '{}': {}", s, e))?;
                Ok(Some(value))
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
}
