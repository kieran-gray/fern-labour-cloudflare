use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::value_objects::NotificationTemplateData;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationRequest {
    pub channel: String,
    pub destination: String,
    pub template_data: NotificationTemplateData,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, String>>,
}
