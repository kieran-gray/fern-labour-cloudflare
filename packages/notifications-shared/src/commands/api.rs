use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::value_objects::NotificationTemplateData;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum PublicCommand {
    #[serde(rename = "RequestNotification")]
    RequestNotification {
        channel: String,
        destination: String,
        template_data: NotificationTemplateData,
        metadata: Option<HashMap<String, String>>,
    },
}
