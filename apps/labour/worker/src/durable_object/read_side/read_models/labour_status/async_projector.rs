use std::rc::Rc;

use anyhow::{Result, anyhow};
use async_trait::async_trait;
use tracing::{info, warn};

use fern_labour_event_sourcing_rs::{
    AsyncRepositoryTrait, CacheExt, CacheTrait, CachedReadModelState, EventEnvelope,
    IncrementalAsyncProjector,
};

use crate::durable_object::{
    read_side::read_models::labour_status::read_model::LabourStatusReadModel,
    write_side::domain::LabourEvent,
};

pub struct LabourStatusReadModelProjector {
    name: String,
    cache_key: String,
    repository: Box<dyn AsyncRepositoryTrait<LabourStatusReadModel>>,
}

impl LabourStatusReadModelProjector {
    pub fn create(repository: Box<dyn AsyncRepositoryTrait<LabourStatusReadModel>>) -> Self {
        Self {
            name: "LabourStatusReadModelProjector".to_string(),
            cache_key: "read_model_cache:LabourStatusReadModelProjector".to_string(),
            repository,
        }
    }

    fn project_event(
        &self,
        model: Option<LabourStatusReadModel>,
        envelope: &EventEnvelope<LabourEvent>,
    ) -> Option<LabourStatusReadModel> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            LabourEvent::LabourPlanned(e) if model.is_none() => Some(LabourStatusReadModel::new(
                e.labour_id,
                e.mother_id.clone(),
                e.mother_name.clone(),
                e.labour_name.clone(),
                timestamp,
            )),

            LabourEvent::LabourPlanUpdated(e) => {
                let mut labour = model?;
                labour.labour_name = e.labour_name.clone();
                labour.updated_at = timestamp;
                Some(labour)
            }
            LabourEvent::LabourPhaseChanged(e) => {
                let mut labour = model?;
                labour.current_phase = e.labour_phase.clone();
                labour.updated_at = timestamp;
                Some(labour)
            }

            LabourEvent::LabourDeleted(_) => {
                let mut labour = model?;
                labour.deleted_at = Some(timestamp);
                labour.updated_at = timestamp;
                Some(labour)
            }
            _ => model,
        }
    }
}

#[async_trait(?Send)]
impl IncrementalAsyncProjector<LabourEvent> for LabourStatusReadModelProjector {
    fn name(&self) -> &str {
        &self.name
    }

    fn get_cached_sequence(&self, cache: &Rc<dyn CacheTrait>) -> i64 {
        cache
            .get::<CachedReadModelState<LabourStatusReadModel>>(self.cache_key.clone())
            .ok()
            .flatten()
            .map(|s| s.sequence)
            .unwrap_or(0)
    }

    async fn process(
        &self,
        cache: &Rc<dyn CacheTrait>,
        events: &[EventEnvelope<LabourEvent>],
        max_sequence: i64,
    ) -> Result<()> {
        let cached_state: CachedReadModelState<LabourStatusReadModel> = cache
            .get(self.cache_key.clone())
            .ok()
            .flatten()
            .unwrap_or_else(CachedReadModelState::empty);

        if events.is_empty() {
            return Ok(());
        }

        let before = cached_state.model.clone();
        let mut current_model = cached_state.model;

        for envelope in events {
            current_model = self.project_event(current_model, envelope);
        }

        if before != current_model
            && let Some(new_model) = &current_model
        {
            info!(projector = %self.name, "Model changed, persisting to D1");
            self.repository
                .overwrite(new_model)
                .await
                .map_err(|e| anyhow!("Failed to persist: {e}"))?;
        }

        let new_state = CachedReadModelState::new(max_sequence, current_model);
        if let Err(e) = cache.set(self.cache_key.clone(), &new_state) {
            warn!(projector = %self.name, error = %e, "Failed to update cache");
        }

        Ok(())
    }
}
