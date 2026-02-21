use std::collections::HashMap;

use async_trait::async_trait;
use chrono::{DateTime, Utc};

use crate::{
    service_clients::notification::exceptions::NotificationClientError,
    value_objects::{NotificationChannel, NotificationTemplateData},
};

#[async_trait(?Send)]
pub trait NotificationClient {
    async fn request_notification(
        &self,
        channel: NotificationChannel,
        destination: String,
        template_data: NotificationTemplateData,
        scheduled_at: Option<DateTime<Utc>>,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<(), NotificationClientError>;
}
