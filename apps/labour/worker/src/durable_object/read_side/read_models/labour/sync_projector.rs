use anyhow::{Result, anyhow};
use fern_labour_labour_shared::value_objects::LabourPhase;

use fern_labour_event_sourcing_rs::{EventEnvelope, SyncProjector, SyncRepositoryTrait};
use uuid::Uuid;

use crate::durable_object::{
    read_side::read_models::labour::read_model::LabourReadModel, write_side::domain::LabourEvent,
};

pub struct LabourReadModelProjector {
    name: String,
    repository: Box<dyn SyncRepositoryTrait<LabourReadModel>>,
}

impl LabourReadModelProjector {
    pub fn create(repository: Box<dyn SyncRepositoryTrait<LabourReadModel>>) -> Self {
        Self {
            name: "LabourReadModelProjector".to_string(),
            repository,
        }
    }

    fn fetch_labour(&self, labour_id: Uuid) -> LabourReadModel {
        self.repository
            .get_by_id(labour_id)
            .expect("Labour must exist here")
    }

    fn project_event(
        &self,
        model: Option<LabourReadModel>,
        envelope: &EventEnvelope<LabourEvent>,
    ) -> Option<LabourReadModel> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            LabourEvent::LabourPlanned(e) if model.is_none() => Some(LabourReadModel::new(
                e.labour_id,
                e.mother_id.clone(),
                e.mother_name.clone(),
                e.first_labour,
                e.due_date,
                e.labour_name.clone(),
                timestamp,
            )),

            LabourEvent::LabourPlanUpdated(e) => {
                let mut labour = match model {
                    Some(model) => model,
                    None => self.fetch_labour(e.labour_id),
                };

                labour.first_labour = e.first_labour;
                labour.due_date = e.due_date;
                labour.labour_name = e.labour_name.clone();
                Some(labour)
            }

            LabourEvent::LabourBegun(e) => {
                let mut labour = match model {
                    Some(model) => model,
                    None => self.fetch_labour(e.labour_id),
                };

                labour.start_time = Some(e.start_time);
                labour.current_phase = LabourPhase::EARLY;
                Some(labour)
            }

            LabourEvent::LabourCompleted(e) => {
                let mut labour = match model {
                    Some(model) => model,
                    None => self.fetch_labour(e.labour_id),
                };

                labour.end_time = Some(e.end_time);
                labour.notes = e.notes.clone();
                labour.current_phase = LabourPhase::COMPLETE;
                Some(labour)
            }

            _ => model,
        }
    }
}

impl SyncProjector<LabourEvent> for LabourReadModelProjector {
    fn name(&self) -> &str {
        &self.name
    }

    fn project_batch(&self, events: &[EventEnvelope<LabourEvent>]) -> Result<()> {
        if events.is_empty() {
            return Ok(());
        }

        let final_model = events
            .iter()
            .fold(None, |model, envelope| self.project_event(model, envelope));

        if let Some(model) = final_model {
            self.repository
                .overwrite(&model)
                .map_err(|err| anyhow!("Failed to persist LabourReadModel: {err}"))?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use fern_labour_event_sourcing_rs::{DecodedCursor, EventMetadata};
    use std::cell::RefCell;
    use std::collections::HashMap;

    use crate::durable_object::write_side::domain::events::{
        LabourBegun, LabourCompleted, LabourPlanned,
    };

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
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

    struct MockLabourRepository {
        store: RefCell<HashMap<Uuid, LabourReadModel>>,
    }

    impl MockLabourRepository {
        fn new() -> Self {
            Self {
                store: RefCell::new(HashMap::new()),
            }
        }
    }

    impl SyncRepositoryTrait<LabourReadModel> for MockLabourRepository {
        fn get_by_id(&self, id: Uuid) -> Result<LabourReadModel> {
            self.store
                .borrow()
                .get(&id)
                .cloned()
                .ok_or_else(|| anyhow!("Not found"))
        }

        fn get(
            &self,
            _limit: usize,
            _cursor: Option<DecodedCursor>,
        ) -> Result<Vec<LabourReadModel>> {
            Ok(self.store.borrow().values().cloned().collect())
        }

        fn upsert(&self, model: &LabourReadModel) -> Result<()> {
            self.store
                .borrow_mut()
                .insert(model.labour_id, model.clone());
            Ok(())
        }

        fn delete(&self, id: Uuid) -> Result<()> {
            self.store.borrow_mut().remove(&id);
            Ok(())
        }

        fn overwrite(&self, model: &LabourReadModel) -> Result<()> {
            self.upsert(model)
        }
    }

    fn create_projector() -> (LabourReadModelProjector, std::rc::Rc<MockLabourRepository>) {
        let repo = std::rc::Rc::new(MockLabourRepository::new());
        let projector = LabourReadModelProjector {
            name: "LabourReadModelProjector".to_string(),
            repository: Box::new(MockLabourRepositoryShared(repo.clone())),
        };
        (projector, repo)
    }

    struct MockLabourRepositoryShared(std::rc::Rc<MockLabourRepository>);

    impl SyncRepositoryTrait<LabourReadModel> for MockLabourRepositoryShared {
        fn get_by_id(&self, id: Uuid) -> Result<LabourReadModel> {
            self.0.get_by_id(id)
        }
        fn get(&self, limit: usize, cursor: Option<DecodedCursor>) -> Result<Vec<LabourReadModel>> {
            self.0.get(limit, cursor)
        }
        fn upsert(&self, model: &LabourReadModel) -> Result<()> {
            self.0.upsert(model)
        }
        fn delete(&self, id: Uuid) -> Result<()> {
            self.0.delete(id)
        }
        fn overwrite(&self, model: &LabourReadModel) -> Result<()> {
            self.0.overwrite(model)
        }
    }

    #[test]
    fn empty_batch_returns_ok() {
        let (projector, _) = create_projector();
        let result = projector.project_batch(&[]);
        assert!(result.is_ok());
    }

    #[test]
    fn labour_planned_creates_read_model() {
        let (projector, repo) = create_projector();

        let event = LabourEvent::LabourPlanned(LabourPlanned {
            labour_id: labour_id(),
            mother_id: "mother_123".to_string(),
            mother_name: "Test Mother".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: Some("Baby Smith".to_string()),
        });

        let envelope = EventEnvelope {
            event,
            metadata: metadata(),
        };

        let result = projector.project_batch(&[envelope]);

        assert!(result.is_ok());
        let model = repo.get_by_id(labour_id()).unwrap();
        assert_eq!(model.mother_id, "mother_123");
        assert_eq!(model.mother_name, "Test Mother");
        assert!(model.first_labour);
        assert_eq!(model.labour_name, Some("Baby Smith".to_string()));
        assert_eq!(model.current_phase, LabourPhase::PLANNED);
    }

    #[test]
    fn labour_begun_updates_start_time_and_phase() {
        let (projector, repo) = create_projector();
        let start_time = Utc::now();

        // First plan the labour
        let plan_event = LabourEvent::LabourPlanned(LabourPlanned {
            labour_id: labour_id(),
            mother_id: "mother_123".to_string(),
            mother_name: "Test Mother".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: None,
        });

        let begun_event = LabourEvent::LabourBegun(LabourBegun {
            labour_id: labour_id(),
            start_time,
        });

        let envelopes = vec![
            EventEnvelope {
                event: plan_event,
                metadata: metadata(),
            },
            EventEnvelope {
                event: begun_event,
                metadata: metadata(),
            },
        ];

        let result = projector.project_batch(&envelopes);

        assert!(result.is_ok());
        let model = repo.get_by_id(labour_id()).unwrap();
        assert_eq!(model.start_time, Some(start_time));
        assert_eq!(model.current_phase, LabourPhase::EARLY);
    }

    #[test]
    fn labour_completed_updates_end_time_and_notes() {
        let (projector, repo) = create_projector();
        let start_time = Utc::now();
        let end_time = Utc::now();

        let events: Vec<EventEnvelope<LabourEvent>> = vec![
            EventEnvelope {
                event: LabourEvent::LabourPlanned(LabourPlanned {
                    labour_id: labour_id(),
                    mother_id: "mother_123".to_string(),
                    mother_name: "M".to_string(),
                    first_labour: true,
                    due_date: Utc::now(),
                    labour_name: None,
                }),
                metadata: metadata(),
            },
            EventEnvelope {
                event: LabourEvent::LabourBegun(LabourBegun {
                    labour_id: labour_id(),
                    start_time,
                }),
                metadata: metadata(),
            },
            EventEnvelope {
                event: LabourEvent::LabourCompleted(LabourCompleted {
                    labour_id: labour_id(),
                    end_time,
                    notes: Some("Baby arrived!".to_string()),
                }),
                metadata: metadata(),
            },
        ];

        let result = projector.project_batch(&events);

        assert!(result.is_ok());
        let model = repo.get_by_id(labour_id()).unwrap();
        assert_eq!(model.end_time, Some(end_time));
        assert_eq!(model.notes, Some("Baby arrived!".to_string()));
        assert_eq!(model.current_phase, LabourPhase::COMPLETE);
    }
}
