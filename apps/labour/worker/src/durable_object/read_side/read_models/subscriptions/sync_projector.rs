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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use fern_labour_event_sourcing_rs::{DecodedCursor, EventEnvelope, EventMetadata};
    use std::cell::RefCell;
    use std::collections::HashMap;
    use uuid::Uuid;

    use crate::durable_object::write_side::domain::events::{
        SubscriberApproved, SubscriberBlocked, SubscriberNotificationMethodsUpdated,
        SubscriberRequested,
    };
    use fern_labour_labour_shared::value_objects::SubscriberContactMethod;

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    }

    fn subscription_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap()
    }

    fn metadata() -> EventMetadata {
        EventMetadata {
            aggregate_id: labour_id(),
            sequence: 1,
            event_version: 1,
            timestamp: Utc::now(),
            user_id: "test_user".to_string(),
        }
    }

    struct MockSubscriptionRepository {
        store: RefCell<HashMap<Uuid, SubscriptionReadModel>>,
    }

    impl MockSubscriptionRepository {
        fn new() -> Self {
            Self {
                store: RefCell::new(HashMap::new()),
            }
        }
    }

    impl SyncRepositoryTrait<SubscriptionReadModel> for MockSubscriptionRepository {
        fn get_by_id(&self, id: Uuid) -> Result<SubscriptionReadModel> {
            self.store
                .borrow()
                .get(&id)
                .cloned()
                .ok_or_else(|| anyhow::anyhow!("Not found"))
        }

        fn get(
            &self,
            _limit: usize,
            _cursor: Option<DecodedCursor>,
        ) -> Result<Vec<SubscriptionReadModel>> {
            Ok(self.store.borrow().values().cloned().collect())
        }

        fn upsert(&self, model: &SubscriptionReadModel) -> Result<()> {
            self.store
                .borrow_mut()
                .insert(model.subscription_id, model.clone());
            Ok(())
        }

        fn delete(&self, id: Uuid) -> Result<()> {
            self.store.borrow_mut().remove(&id);
            Ok(())
        }

        fn overwrite(&self, model: &SubscriptionReadModel) -> Result<()> {
            self.upsert(model)
        }
    }

    fn create_projector() -> (
        SubscriptionReadModelProjector,
        std::rc::Rc<MockSubscriptionRepository>,
    ) {
        struct Shared(std::rc::Rc<MockSubscriptionRepository>);
        impl SyncRepositoryTrait<SubscriptionReadModel> for Shared {
            fn get_by_id(&self, id: Uuid) -> Result<SubscriptionReadModel> {
                self.0.get_by_id(id)
            }
            fn get(
                &self,
                l: usize,
                c: Option<DecodedCursor>,
            ) -> Result<Vec<SubscriptionReadModel>> {
                self.0.get(l, c)
            }
            fn upsert(&self, m: &SubscriptionReadModel) -> Result<()> {
                self.0.upsert(m)
            }
            fn delete(&self, id: Uuid) -> Result<()> {
                self.0.delete(id)
            }
            fn overwrite(&self, m: &SubscriptionReadModel) -> Result<()> {
                self.0.overwrite(m)
            }
        }
        let repo = std::rc::Rc::new(MockSubscriptionRepository::new());
        let projector = SubscriptionReadModelProjector {
            name: "SubscriptionReadModelProjector".to_string(),
            repository: Box::new(Shared(repo.clone())),
        };
        (projector, repo)
    }

    #[test]
    fn empty_batch_returns_ok() {
        let (projector, _) = create_projector();
        let result = projector.project_batch(&[]);
        assert!(result.is_ok());
    }

    #[test]
    fn subscriber_requested_creates_subscription() {
        let (projector, repo) = create_projector();

        let event = LabourEvent::SubscriberRequested(SubscriberRequested {
            labour_id: labour_id(),
            subscription_id: subscription_id(),
            subscriber_id: "user_123".to_string(),
            subscriber_name: "John".to_string(),
        });

        let result = projector.project_batch(&[EventEnvelope {
            event,
            metadata: metadata(),
        }]);

        assert!(result.is_ok());
        let subscription = repo.get_by_id(subscription_id()).unwrap();
        assert_eq!(subscription.subscriber_id, "user_123");
        assert_eq!(subscription.subscriber_name, "John");
        assert_eq!(subscription.status, SubscriberStatus::REQUESTED);
    }

    #[test]
    fn subscriber_approved_updates_status() {
        let (projector, repo) = create_projector();

        // First create the subscription
        let events = vec![
            EventEnvelope {
                event: LabourEvent::SubscriberRequested(SubscriberRequested {
                    labour_id: labour_id(),
                    subscription_id: subscription_id(),
                    subscriber_id: "user_123".to_string(),
                    subscriber_name: "John".to_string(),
                }),
                metadata: metadata(),
            },
            EventEnvelope {
                event: LabourEvent::SubscriberApproved(SubscriberApproved {
                    labour_id: labour_id(),
                    subscription_id: subscription_id(),
                }),
                metadata: metadata(),
            },
        ];

        let result = projector.project_batch(&events);

        assert!(result.is_ok());
        let subscription = repo.get_by_id(subscription_id()).unwrap();
        assert_eq!(subscription.status, SubscriberStatus::SUBSCRIBED);
    }

    #[test]
    fn subscriber_blocked_updates_status() {
        let (projector, repo) = create_projector();

        let events = vec![
            EventEnvelope {
                event: LabourEvent::SubscriberRequested(SubscriberRequested {
                    labour_id: labour_id(),
                    subscription_id: subscription_id(),
                    subscriber_id: "user_123".to_string(),
                    subscriber_name: "John".to_string(),
                }),
                metadata: metadata(),
            },
            EventEnvelope {
                event: LabourEvent::SubscriberBlocked(SubscriberBlocked {
                    labour_id: labour_id(),
                    subscription_id: subscription_id(),
                }),
                metadata: metadata(),
            },
        ];

        let result = projector.project_batch(&events);

        assert!(result.is_ok());
        let subscription = repo.get_by_id(subscription_id()).unwrap();
        assert_eq!(subscription.status, SubscriberStatus::BLOCKED);
    }

    #[test]
    fn subscriber_notification_methods_updated() {
        let (projector, repo) = create_projector();

        let events = vec![
            EventEnvelope {
                event: LabourEvent::SubscriberRequested(SubscriberRequested {
                    labour_id: labour_id(),
                    subscription_id: subscription_id(),
                    subscriber_id: "user_123".to_string(),
                    subscriber_name: "John".to_string(),
                }),
                metadata: metadata(),
            },
            EventEnvelope {
                event: LabourEvent::SubscriberNotificationMethodsUpdated(
                    SubscriberNotificationMethodsUpdated {
                        labour_id: labour_id(),
                        subscription_id: subscription_id(),
                        notification_methods: vec![
                            SubscriberContactMethod::EMAIL,
                            SubscriberContactMethod::SMS,
                        ],
                    },
                ),
                metadata: metadata(),
            },
        ];

        let result = projector.project_batch(&events);

        assert!(result.is_ok());
        let subscription = repo.get_by_id(subscription_id()).unwrap();
        assert_eq!(subscription.contact_methods.len(), 2);
    }
}
