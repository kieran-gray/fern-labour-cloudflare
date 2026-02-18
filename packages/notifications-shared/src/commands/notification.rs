use std::collections::HashMap;

use crate::value_objects::{
    NotificationChannel, NotificationDestination, NotificationTemplateData, RenderedContent,
    ScheduledAt,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum NotificationCommand {
    RequestNotification {
        notification_id: Uuid,
        channel: NotificationChannel,
        destination: NotificationDestination,
        template_data: NotificationTemplateData,
        scheduled_at: Option<ScheduledAt>,
        metadata: Option<HashMap<String, String>>,
    },
    StoreRenderedContent {
        notification_id: Uuid,
        rendered_content: RenderedContent,
    },
    MarkAsScheduled {
        notification_id: Uuid,
        external_id: Option<String>,
        provider: String,
    },
    MarkAsDispatched {
        notification_id: Uuid,
        external_id: Option<String>,
        sent_via_provider: String,
    },
    MarkAsDelivered {
        notification_id: Uuid,
        provider: String,
    },
    MarkAsFailed {
        notification_id: Uuid,
        reason: Option<String>,
        provider: String,
    },
    MarkContentRedacted {
        notification_id: Uuid,
    },
    DeleteNotification {
        notification_id: Uuid,
    },
}
