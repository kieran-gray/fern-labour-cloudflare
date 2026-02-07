use anyhow::Result;
use async_trait::async_trait;

use fern_labour_event_sourcing_rs::{EventEnvelope, SyncProjector, SyncRepositoryTrait};

use crate::durable_object::{
    read_side::read_models::labour_updates::LabourUpdateReadModel, write_side::domain::LabourEvent,
};

pub struct LabourUpdateReadModelProjector {
    name: String,
    repository: Box<dyn SyncRepositoryTrait<LabourUpdateReadModel>>,
}

impl LabourUpdateReadModelProjector {
    pub fn create(repository: Box<dyn SyncRepositoryTrait<LabourUpdateReadModel>>) -> Self {
        Self {
            name: "LabourUpdateReadModelProjector".to_string(),
            repository,
        }
    }

    fn project_event(&self, envelope: &EventEnvelope<LabourEvent>) -> Result<()> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            LabourEvent::LabourUpdatePosted(e) => {
                let labour_update = LabourUpdateReadModel::new(
                    e.labour_id,
                    e.labour_update_id,
                    e.labour_update_type.clone(),
                    e.message.clone(),
                    e.application_generated,
                    e.sent_time,
                );
                self.repository.overwrite(&labour_update)
            }
            LabourEvent::LabourUpdateMessageUpdated(e) => {
                let mut labour_update = self
                    .repository
                    .get_by_id(e.labour_update_id)
                    .unwrap_or_else(|_| {
                        panic!("No labour_update found with id: {}", e.labour_update_id)
                    });
                labour_update.message = e.message.clone();
                labour_update.edited = true;
                labour_update.updated_at = timestamp;
                self.repository.upsert(&labour_update)
            }
            LabourEvent::LabourUpdateTypeUpdated(e) => {
                let mut labour_update = self
                    .repository
                    .get_by_id(e.labour_update_id)
                    .unwrap_or_else(|_| {
                        panic!("No labour_update found with id: {}", e.labour_update_id)
                    });
                labour_update.labour_update_type = e.labour_update_type.clone();
                labour_update.updated_at = timestamp;
                self.repository.upsert(&labour_update)
            }
            LabourEvent::LabourUpdateDeleted(e) => self.repository.delete(e.labour_update_id),
            _ => Ok(()),
        }
    }
}

#[async_trait(?Send)]
impl SyncProjector<LabourEvent> for LabourUpdateReadModelProjector {
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
    use fern_labour_labour_shared::value_objects::LabourUpdateType;
    use std::cell::RefCell;
    use std::collections::HashMap;
    use uuid::Uuid;

    use crate::durable_object::write_side::domain::events::{
        LabourUpdateDeleted, LabourUpdateMessageUpdated, LabourUpdatePosted,
    };

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    }

    fn update_id() -> Uuid {
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

    struct MockLabourUpdateRepository {
        store: RefCell<HashMap<Uuid, LabourUpdateReadModel>>,
    }

    impl MockLabourUpdateRepository {
        fn new() -> Self {
            Self {
                store: RefCell::new(HashMap::new()),
            }
        }
    }

    impl SyncRepositoryTrait<LabourUpdateReadModel> for MockLabourUpdateRepository {
        fn get_by_id(&self, id: Uuid) -> Result<LabourUpdateReadModel> {
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
        ) -> Result<Vec<LabourUpdateReadModel>> {
            Ok(self.store.borrow().values().cloned().collect())
        }

        fn upsert(&self, model: &LabourUpdateReadModel) -> Result<()> {
            self.store
                .borrow_mut()
                .insert(model.labour_update_id, model.clone());
            Ok(())
        }

        fn delete(&self, id: Uuid) -> Result<()> {
            self.store.borrow_mut().remove(&id);
            Ok(())
        }

        fn overwrite(&self, model: &LabourUpdateReadModel) -> Result<()> {
            self.upsert(model)
        }
    }

    fn create_projector() -> (
        LabourUpdateReadModelProjector,
        std::rc::Rc<MockLabourUpdateRepository>,
    ) {
        struct Shared(std::rc::Rc<MockLabourUpdateRepository>);
        impl SyncRepositoryTrait<LabourUpdateReadModel> for Shared {
            fn get_by_id(&self, id: Uuid) -> Result<LabourUpdateReadModel> {
                self.0.get_by_id(id)
            }
            fn get(
                &self,
                l: usize,
                c: Option<DecodedCursor>,
            ) -> Result<Vec<LabourUpdateReadModel>> {
                self.0.get(l, c)
            }
            fn upsert(&self, m: &LabourUpdateReadModel) -> Result<()> {
                self.0.upsert(m)
            }
            fn delete(&self, id: Uuid) -> Result<()> {
                self.0.delete(id)
            }
            fn overwrite(&self, m: &LabourUpdateReadModel) -> Result<()> {
                self.0.overwrite(m)
            }
        }
        let repo = std::rc::Rc::new(MockLabourUpdateRepository::new());
        let projector = LabourUpdateReadModelProjector {
            name: "LabourUpdateReadModelProjector".to_string(),
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
    fn labour_update_posted_creates_read_model() {
        let (projector, repo) = create_projector();

        let event = LabourEvent::LabourUpdatePosted(LabourUpdatePosted {
            labour_id: labour_id(),
            labour_update_id: update_id(),
            labour_update_type: LabourUpdateType::ANNOUNCEMENT,
            message: "Hello world!".to_string(),
            application_generated: false,
            sent_time: Utc::now(),
        });

        let result = projector.project_batch(&[EventEnvelope {
            event,
            metadata: metadata(),
        }]);

        assert!(result.is_ok());
        let model = repo.get_by_id(update_id()).unwrap();
        assert_eq!(model.message, "Hello world!");
        assert_eq!(model.labour_update_type, LabourUpdateType::ANNOUNCEMENT);
        assert!(!model.application_generated);
    }

    #[test]
    fn labour_update_message_updated_changes_message() {
        let (projector, repo) = create_projector();

        let events = vec![
            EventEnvelope {
                event: LabourEvent::LabourUpdatePosted(LabourUpdatePosted {
                    labour_id: labour_id(),
                    labour_update_id: update_id(),
                    labour_update_type: LabourUpdateType::ANNOUNCEMENT,
                    message: "Original".to_string(),
                    application_generated: false,
                    sent_time: Utc::now(),
                }),
                metadata: metadata(),
            },
            EventEnvelope {
                event: LabourEvent::LabourUpdateMessageUpdated(LabourUpdateMessageUpdated {
                    labour_id: labour_id(),
                    labour_update_id: update_id(),
                    message: "Updated message".to_string(),
                }),
                metadata: metadata(),
            },
        ];

        let result = projector.project_batch(&events);

        assert!(result.is_ok());
        let model = repo.get_by_id(update_id()).unwrap();
        assert_eq!(model.message, "Updated message");
        assert!(model.edited);
    }

    #[test]
    fn labour_update_deleted_removes_read_model() {
        let (projector, repo) = create_projector();

        let events = vec![
            EventEnvelope {
                event: LabourEvent::LabourUpdatePosted(LabourUpdatePosted {
                    labour_id: labour_id(),
                    labour_update_id: update_id(),
                    labour_update_type: LabourUpdateType::ANNOUNCEMENT,
                    message: "Test".to_string(),
                    application_generated: false,
                    sent_time: Utc::now(),
                }),
                metadata: metadata(),
            },
            EventEnvelope {
                event: LabourEvent::LabourUpdateDeleted(LabourUpdateDeleted {
                    labour_id: labour_id(),
                    labour_update_id: update_id(),
                }),
                metadata: metadata(),
            },
        ];

        let result = projector.project_batch(&events);

        assert!(result.is_ok());
        assert!(repo.get_by_id(update_id()).is_err());
    }
}
