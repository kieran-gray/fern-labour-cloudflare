pub mod contraction;
pub mod labour;
pub mod labour_update;
pub mod subscriber;
pub mod subscription;

pub use contraction::*;
pub use labour::*;
pub use labour_update::*;
pub use subscriber::*;
pub use subscription::*;

use fern_labour_event_sourcing_rs::{Event, StoredEvent};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum LabourEvent {
    LabourPlanned(LabourPlanned),
    LabourPlanUpdated(LabourPlanUpdated),
    LabourBegun(LabourBegun),
    LabourCompleted(LabourCompleted),
    LabourInviteSent(LabourInviteSent),
    LabourDeleted(LabourDeleted),
    LabourPhaseChanged(LabourPhaseChanged),

    ContractionStarted(ContractionStarted),
    ContractionEnded(ContractionEnded),
    ContractionUpdated(ContractionUpdated),
    ContractionDeleted(ContractionDeleted),

    LabourUpdatePosted(LabourUpdatePosted),
    LabourUpdateMessageUpdated(LabourUpdateMessageUpdated),
    LabourUpdateTypeUpdated(LabourUpdateTypeUpdated),
    LabourUpdateDeleted(LabourUpdateDeleted),

    SubscriptionTokenSet(SubscriptionTokenSet),
    SubscriptionTokenInvalidated(SubscriptionTokenInvalidated),

    SubscriberRequested(SubscriberRequested),
    SubscriberUnsubscribed(SubscriberUnsubscribed),
    SubscriberNotificationMethodsUpdated(SubscriberNotificationMethodsUpdated),
    SubscriberAccessLevelUpdated(SubscriberAccessLevelUpdated),
    SubscriberApproved(SubscriberApproved),
    SubscriberRemoved(SubscriberRemoved),
    SubscriberBlocked(SubscriberBlocked),
    SubscriberUnblocked(SubscriberUnblocked),
    SubscriberRoleUpdated(SubscriberRoleUpdated),
}

impl LabourEvent {
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

    pub fn contraction_id(&self) -> Option<Uuid> {
        match self {
            LabourEvent::ContractionStarted(e) => Some(e.contraction_id),
            LabourEvent::ContractionEnded(e) => Some(e.contraction_id),
            LabourEvent::ContractionUpdated(e) => Some(e.contraction_id),
            LabourEvent::ContractionDeleted(e) => Some(e.contraction_id),
            _ => None,
        }
    }

    pub fn labour_update_id(&self) -> Option<Uuid> {
        match self {
            LabourEvent::LabourUpdatePosted(e) => Some(e.labour_update_id),
            LabourEvent::LabourUpdateMessageUpdated(e) => Some(e.labour_update_id),
            LabourEvent::LabourUpdateTypeUpdated(e) => Some(e.labour_update_id),
            LabourEvent::LabourUpdateDeleted(e) => Some(e.labour_update_id),
            _ => None,
        }
    }
}

macro_rules! delegate_event_impl {
      ($($variant:ident),+ $(,)?) => {
          impl Event for LabourEvent {
              fn event_type(&self) -> &str {
                  match self { $(LabourEvent::$variant(e) => e.event_type(),)+ }
              }
              fn event_version(&self) -> i64 {
                  match self { $(LabourEvent::$variant(e) => e.event_version(),)+ }
              }
              fn aggregate_id(&self) -> Uuid {
                  match self { $(LabourEvent::$variant(e) => e.aggregate_id(),)+ }
              }
          }
      };
  }

delegate_event_impl!(
    ContractionStarted,
    ContractionUpdated,
    ContractionEnded,
    ContractionDeleted,
    LabourPlanned,
    LabourBegun,
    LabourCompleted,
    LabourDeleted,
    LabourInviteSent,
    LabourPlanUpdated,
    LabourUpdateDeleted,
    LabourUpdatePosted,
    LabourUpdateMessageUpdated,
    LabourUpdateTypeUpdated,
    LabourPhaseChanged,
    SubscriptionTokenSet,
    SubscriptionTokenInvalidated,
    SubscriberApproved,
    SubscriberBlocked,
    SubscriberRequested,
    SubscriberRemoved,
    SubscriberUnblocked,
    SubscriberUnsubscribed,
    SubscriberNotificationMethodsUpdated,
    SubscriberAccessLevelUpdated,
    SubscriberRoleUpdated,
);
