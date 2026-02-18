use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::value_objects::{NotificationChannel, NotificationDestination, RenderedContent};

#[derive(Debug, Deserialize, Serialize)]
pub struct DispatchRequest {
    pub notification_id: Uuid,
    pub channel: NotificationChannel,
    pub destination: NotificationDestination,
    pub rendered_content: RenderedContent,
    pub idempotency_key: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ScheduleRequest {
    pub notification_id: Uuid,
    pub channel: NotificationChannel,
    pub destination: NotificationDestination,
    pub rendered_content: RenderedContent,
    pub scheduled_at: DateTime<Utc>,
    pub idempotency_key: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RedactRequest {
    pub notification_id: Uuid,
    pub external_id: String,
    pub provider: String,
}
