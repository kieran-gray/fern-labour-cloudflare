use fern_labour_notifications_shared::value_objects::{
    NotificationChannel, NotificationDestination, NotificationTemplateData, RenderedContent,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fmt::Debug};
use uuid::Uuid;

use fern_labour_event_sourcing_rs::{Event, impl_event};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationRequested {
    pub notification_id: Uuid,
    pub channel: NotificationChannel,
    pub destination: NotificationDestination,
    pub template_data: NotificationTemplateData,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RenderedContentStored {
    pub notification_id: Uuid,
    pub rendered_content: RenderedContent,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationDispatched {
    pub notification_id: Uuid,
    pub external_id: Option<String>,
    pub sent_via_provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationDelivered {
    pub notification_id: Uuid,
    pub external_id: String,
    pub provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationDeliveryFailed {
    pub notification_id: Uuid,
    pub external_id: String,
    pub provider: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationContentRedacted {
    pub notification_id: Uuid,
    pub external_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationDeleted {
    pub notification_id: Uuid,
}

impl_event!(NotificationRequested, notification_id);
impl_event!(RenderedContentStored, notification_id);
impl_event!(NotificationDispatched, notification_id);
impl_event!(NotificationDelivered, notification_id);
impl_event!(NotificationDeliveryFailed, notification_id);
impl_event!(NotificationContentRedacted, notification_id);
impl_event!(NotificationDeleted, notification_id);

use fern_labour_event_sourcing_rs::StoredEvent;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum NotificationEvent {
    NotificationRequested(NotificationRequested),
    RenderedContentStored(RenderedContentStored),
    NotificationDispatched(NotificationDispatched),
    NotificationDelivered(NotificationDelivered),
    NotificationDeliveryFailed(NotificationDeliveryFailed),
    NotificationContentRedacted(NotificationContentRedacted),
    NotificationDeleted(NotificationDeleted),
}

impl NotificationEvent {
    pub fn into_stored_event(self) -> StoredEvent {
        let event_str = serde_json::to_string(&self).unwrap();

        StoredEvent {
            aggregate_id: self.aggregate_id().to_string(),
            event_type: self.event_type().to_string(),
            event_data: event_str,
            event_version: self.event_version(),
        }
    }

    pub fn from_stored_event(event: StoredEvent) -> Self {
        serde_json::from_str(&event.event_data).unwrap()
    }
}

macro_rules! delegate_event_impl {
      ($($variant:ident),+ $(,)?) => {
          impl Event for NotificationEvent {
              fn event_type(&self) -> &str {
                  match self { $(NotificationEvent::$variant(e) => e.event_type(),)+ }
              }
              fn event_version(&self) -> i64 {
                  match self { $(NotificationEvent::$variant(e) => e.event_version(),)+ }
              }
              fn aggregate_id(&self) -> Uuid {
                  match self { $(NotificationEvent::$variant(e) => e.aggregate_id(),)+ }
              }
          }
      };
  }

delegate_event_impl!(
    NotificationRequested,
    RenderedContentStored,
    NotificationDispatched,
    NotificationDelivered,
    NotificationDeliveryFailed,
    NotificationContentRedacted,
    NotificationDeleted,
);
