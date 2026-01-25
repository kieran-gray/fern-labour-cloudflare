use serde::{Deserialize, Serialize};

use crate::value_objects::NotificationStatus;

#[derive(Debug, Deserialize, Serialize)]
pub struct DispatchResponse {
    pub external_id: Option<String>,
    pub provider: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RedactResponse {
    pub redacted: bool,
}

#[derive(Debug, Deserialize)]
pub struct WebhookInterpretationResponse {
    pub external_id: String,
    pub status: NotificationStatus,
    pub provider: String,
}
