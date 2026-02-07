use anyhow::Result;
use async_trait::async_trait;
use fern_labour_labour_shared::value_objects::contraction::duration::Duration;

use fern_labour_event_sourcing_rs::{EventEnvelope, SyncProjector, SyncRepositoryTrait};

use crate::durable_object::{
    read_side::read_models::contractions::ContractionReadModel, write_side::domain::LabourEvent,
};

pub struct ContractionReadModelProjector {
    name: String,
    repository: Box<dyn SyncRepositoryTrait<ContractionReadModel>>,
}

impl ContractionReadModelProjector {
    pub fn create(repository: Box<dyn SyncRepositoryTrait<ContractionReadModel>>) -> Self {
        Self {
            name: "ContractionReadModelProjector".to_string(),
            repository,
        }
    }

    fn project_event(&self, envelope: &EventEnvelope<LabourEvent>) -> Result<()> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            LabourEvent::ContractionStarted(e) => {
                let contraction = ContractionReadModel::new(
                    e.labour_id,
                    e.contraction_id,
                    Duration::create(e.start_time, e.start_time)?,
                    None,
                    timestamp,
                );
                self.repository.overwrite(&contraction)
            }
            LabourEvent::ContractionEnded(e) => {
                let mut contraction =
                    self.repository
                        .get_by_id(e.contraction_id)
                        .unwrap_or_else(|_| {
                            panic!("No contraction found with id: {}", e.contraction_id)
                        });
                let duration = Duration::create(*contraction.duration.start_time(), e.end_time)?;
                contraction.duration_seconds = duration.duration_seconds();
                contraction.duration = duration;
                contraction.intensity = Some(e.intensity);
                contraction.updated_at = timestamp;
                self.repository.upsert(&contraction)
            }
            LabourEvent::ContractionDeleted(e) => self.repository.delete(e.contraction_id),
            LabourEvent::ContractionUpdated(e) => {
                let mut contraction =
                    self.repository
                        .get_by_id(e.contraction_id)
                        .unwrap_or_else(|_| {
                            panic!("No contraction found with id: {}", e.contraction_id)
                        });
                let new_start_time = match &e.start_time {
                    Some(start_time) => *start_time,
                    None => *contraction.duration.start_time(),
                };
                let new_end_time = match &e.end_time {
                    Some(end_time) => *end_time,
                    None => *contraction.duration.end_time(),
                };
                let duration = Duration::create(new_start_time, new_end_time)?;
                contraction.duration_seconds = duration.duration_seconds();
                contraction.duration = duration;
                contraction.intensity = e.intensity;
                self.repository.upsert(&contraction)
            }
            _ => Ok(()),
        }
    }
}

#[async_trait(?Send)]
impl SyncProjector<LabourEvent> for ContractionReadModelProjector {
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
    use crate::durable_object::write_side::domain::events::{
        ContractionDeleted, ContractionEnded, ContractionStarted, ContractionUpdated,
    };
    use chrono::{TimeZone, Utc};
    use fern_labour_event_sourcing_rs::{DecodedCursor, EventMetadata};
    use std::cell::RefCell;
    use std::collections::HashMap;
    use uuid::Uuid;

    struct MockSyncRepository {
        data: RefCell<HashMap<Uuid, ContractionReadModel>>,
        deleted: RefCell<Vec<Uuid>>,
    }

    impl MockSyncRepository {
        fn new() -> Self {
            Self {
                data: RefCell::new(HashMap::new()),
                deleted: RefCell::new(Vec::new()),
            }
        }

        fn with_contraction(model: ContractionReadModel) -> Self {
            let repo = Self::new();
            repo.data.borrow_mut().insert(model.contraction_id, model);
            repo
        }
    }

    impl SyncRepositoryTrait<ContractionReadModel> for MockSyncRepository {
        fn get_by_id(&self, id: Uuid) -> Result<ContractionReadModel> {
            self.data
                .borrow()
                .get(&id)
                .cloned()
                .ok_or_else(|| anyhow::anyhow!("Not found"))
        }

        fn get(
            &self,
            _limit: usize,
            _cursor: Option<DecodedCursor>,
        ) -> Result<Vec<ContractionReadModel>> {
            Ok(self.data.borrow().values().cloned().collect())
        }

        fn upsert(&self, value: &ContractionReadModel) -> Result<()> {
            self.data
                .borrow_mut()
                .insert(value.contraction_id, value.clone());
            Ok(())
        }

        fn delete(&self, id: Uuid) -> Result<()> {
            self.data.borrow_mut().remove(&id);
            self.deleted.borrow_mut().push(id);
            Ok(())
        }

        fn overwrite(&self, value: &ContractionReadModel) -> Result<()> {
            self.data
                .borrow_mut()
                .insert(value.contraction_id, value.clone());
            Ok(())
        }
    }

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    }

    fn create_envelope(event: LabourEvent, sequence: i64) -> EventEnvelope<LabourEvent> {
        EventEnvelope {
            metadata: EventMetadata {
                aggregate_id: labour_id(),
                sequence,
                event_version: 1,
                timestamp: Utc::now(),
                user_id: "test-user".to_string(),
            },
            event,
        }
    }

    #[test]
    fn contraction_started_creates_read_model() {
        let repo = MockSyncRepository::new();
        let projector = ContractionReadModelProjector::create(Box::new(repo));

        let contraction_id = Uuid::now_v7();
        let start_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 0, 0).unwrap();

        let event = LabourEvent::ContractionStarted(ContractionStarted {
            labour_id: labour_id(),
            contraction_id,
            start_time,
        });

        projector
            .project_batch(&[create_envelope(event, 1)])
            .unwrap();

        let stored = projector.repository.get_by_id(contraction_id).unwrap();
        assert_eq!(stored.contraction_id, contraction_id);
        assert_eq!(stored.labour_id, labour_id());
        assert_eq!(*stored.duration.start_time(), start_time);
        assert!(stored.intensity.is_none());
    }

    #[test]
    fn contraction_ended_updates_duration_and_intensity() {
        let contraction_id = Uuid::now_v7();
        let start_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 0, 0).unwrap();

        let initial = ContractionReadModel::new(
            labour_id(),
            contraction_id,
            Duration::create(start_time, start_time).unwrap(),
            None,
            Utc::now(),
        );

        let repo = MockSyncRepository::with_contraction(initial);
        let projector = ContractionReadModelProjector::create(Box::new(repo));

        let end_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 1, 0).unwrap();
        let event = LabourEvent::ContractionEnded(ContractionEnded {
            labour_id: labour_id(),
            contraction_id,
            end_time,
            intensity: 7,
        });

        projector
            .project_batch(&[create_envelope(event, 2)])
            .unwrap();

        let stored = projector.repository.get_by_id(contraction_id).unwrap();
        assert_eq!(*stored.duration.end_time(), end_time);
        assert_eq!(stored.intensity, Some(7));
        assert_eq!(stored.duration_seconds, 60.0);
    }

    #[test]
    fn contraction_updated_modifies_times_and_intensity() {
        let contraction_id = Uuid::now_v7();
        let start_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 0, 0).unwrap();
        let end_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 1, 0).unwrap();

        let initial = ContractionReadModel::new(
            labour_id(),
            contraction_id,
            Duration::create(start_time, end_time).unwrap(),
            Some(5),
            Utc::now(),
        );

        let repo = MockSyncRepository::with_contraction(initial);
        let projector = ContractionReadModelProjector::create(Box::new(repo));

        let new_end_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 2, 0).unwrap();
        let event = LabourEvent::ContractionUpdated(ContractionUpdated {
            labour_id: labour_id(),
            contraction_id,
            start_time: None,
            end_time: Some(new_end_time),
            intensity: Some(8),
        });

        projector
            .project_batch(&[create_envelope(event, 3)])
            .unwrap();

        let stored = projector.repository.get_by_id(contraction_id).unwrap();
        assert_eq!(*stored.duration.start_time(), start_time);
        assert_eq!(*stored.duration.end_time(), new_end_time);
        assert_eq!(stored.intensity, Some(8));
        assert_eq!(stored.duration_seconds, 120.0);
    }

    #[test]
    fn contraction_deleted_removes_from_repository() {
        let contraction_id = Uuid::now_v7();
        let start_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 0, 0).unwrap();

        let initial = ContractionReadModel::new(
            labour_id(),
            contraction_id,
            Duration::create(start_time, start_time).unwrap(),
            None,
            Utc::now(),
        );

        let repo = MockSyncRepository::with_contraction(initial);
        let projector = ContractionReadModelProjector::create(Box::new(repo));

        let event = LabourEvent::ContractionDeleted(ContractionDeleted {
            labour_id: labour_id(),
            contraction_id,
        });

        projector
            .project_batch(&[create_envelope(event, 4)])
            .unwrap();

        assert!(projector.repository.get_by_id(contraction_id).is_err());
    }

    #[test]
    fn ignores_non_contraction_events() {
        use crate::durable_object::write_side::domain::events::LabourPlanned;

        let repo = MockSyncRepository::new();
        let projector = ContractionReadModelProjector::create(Box::new(repo));

        let event = LabourEvent::LabourPlanned(LabourPlanned {
            labour_id: labour_id(),
            mother_id: "mother_1".to_string(),
            mother_name: "Test".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: None,
        });

        let result = projector.project_batch(&[create_envelope(event, 1)]);
        assert!(result.is_ok());
    }

    #[test]
    fn empty_batch_returns_ok() {
        let repo = MockSyncRepository::new();
        let projector = ContractionReadModelProjector::create(Box::new(repo));

        let result = projector.project_batch(&[]);
        assert!(result.is_ok());
    }

    #[test]
    fn projects_multiple_events_in_sequence() {
        let repo = MockSyncRepository::new();
        let projector = ContractionReadModelProjector::create(Box::new(repo));

        let contraction_id = Uuid::now_v7();
        let start_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 0, 0).unwrap();
        let end_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 1, 30).unwrap();

        let events = vec![
            create_envelope(
                LabourEvent::ContractionStarted(ContractionStarted {
                    labour_id: labour_id(),
                    contraction_id,
                    start_time,
                }),
                1,
            ),
            create_envelope(
                LabourEvent::ContractionEnded(ContractionEnded {
                    labour_id: labour_id(),
                    contraction_id,
                    end_time,
                    intensity: 6,
                }),
                2,
            ),
        ];

        projector.project_batch(&events).unwrap();

        let stored = projector.repository.get_by_id(contraction_id).unwrap();
        assert_eq!(*stored.duration.start_time(), start_time);
        assert_eq!(*stored.duration.end_time(), end_time);
        assert_eq!(stored.intensity, Some(6));
        assert_eq!(stored.duration_seconds, 90.0);
    }
}
