use anyhow::Result;
use async_trait::async_trait;
use fern_labour_labour_shared::value_objects::{
    SubscriberAccessLevel, SubscriberRole, subscriber::status::SubscriberStatus,
};

use fern_labour_event_sourcing_rs::{EventEnvelope, SyncProjector, SyncRepositoryTrait};

use crate::durable_object::{
    read_side::read_models::subscriptions::SubscriptionReadModel, write_side::domain::LabourEvent,
};

pub struct SubscriptionReadModelProjector {
    name: String,
    repository: Box<dyn SyncRepositoryTrait<SubscriptionReadModel>>,
}

impl SubscriptionReadModelProjector {
    pub fn create(repository: Box<dyn SyncRepositoryTrait<SubscriptionReadModel>>) -> Self {
        Self {
            name: "SubscriptionReadModelProjector".to_string(),
            repository,
        }
    }

    fn project_event(&self, envelope: &EventEnvelope<LabourEvent>) -> Result<()> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            LabourEvent::SubscriberRequested(e) => {
                match self.repository.get_by_id(e.subscription_id) {
                    Ok(mut existing_subscription) => {
                        existing_subscription.status = SubscriberStatus::REQUESTED;
                        existing_subscription.updated_at = timestamp;
                        self.repository.upsert(&existing_subscription)
                    }
                    Err(_) => {
                        let subscription = SubscriptionReadModel::new(
                            e.subscription_id,
                            e.labour_id,
                            e.subscriber_name.clone(),
                            e.subscriber_id.clone(),
                            SubscriberRole::LOVED_ONE,
                            SubscriberStatus::REQUESTED,
                            SubscriberAccessLevel::BASIC,
                            vec![],
                            timestamp,
                        );
                        self.repository.overwrite(&subscription)
                    }
                }
            }
            LabourEvent::SubscriberApproved(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.status = SubscriberStatus::SUBSCRIBED;
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            LabourEvent::SubscriberUnsubscribed(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.status = SubscriberStatus::UNSUBSCRIBED;
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            LabourEvent::SubscriberRemoved(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.status = SubscriberStatus::REMOVED;
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            LabourEvent::SubscriberBlocked(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.status = SubscriberStatus::BLOCKED;
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            LabourEvent::SubscriberUnblocked(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.status = SubscriberStatus::REMOVED;
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            LabourEvent::SubscriberRoleUpdated(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.role = e.role.clone();
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            LabourEvent::SubscriberAccessLevelUpdated(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.access_level = e.access_level.clone();
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            LabourEvent::SubscriberNotificationMethodsUpdated(e) => {
                let mut subscription =
                    self.repository
                        .get_by_id(e.subscription_id)
                        .unwrap_or_else(|_| {
                            panic!("No subscription found with id: {}", e.subscription_id)
                        });
                subscription.contact_methods = e.notification_methods.clone();
                subscription.updated_at = timestamp;
                self.repository.upsert(&subscription)
            }
            _ => Ok(()),
        }
    }
}

#[async_trait(?Send)]
impl SyncProjector<LabourEvent> for SubscriptionReadModelProjector {
    fn name(&self) -> &str {
        &self.name
    }

    fn project_batch(&self, events: &[EventEnvelope<LabourEvent>]) -> Result<()> {
        if events.is_empty() {
            return Ok(());
        }

        events
            .iter()
            .try_for_each(|envelope| self.project_event(envelope))
    }
}
