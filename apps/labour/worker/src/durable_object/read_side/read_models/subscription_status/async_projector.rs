use std::rc::Rc;

use anyhow::{Result, anyhow};
use async_trait::async_trait;
use fern_labour_labour_shared::value_objects::subscriber::status::SubscriberStatus;
use tracing::{info, warn};

use fern_labour_event_sourcing_rs::{
    AsyncRepositoryTrait, CacheExt, CacheTrait, CachedReadModelState, EventEnvelope,
    IncrementalAsyncProjector,
};

use crate::durable_object::{
    read_side::read_models::subscription_status::SubscriptionStatusReadModel,
    write_side::domain::LabourEvent,
};

pub struct SubscriptionStatusReadModelProjector {
    name: String,
    cache_key: String,
    repository: Box<dyn AsyncRepositoryTrait<SubscriptionStatusReadModel>>,
}

impl SubscriptionStatusReadModelProjector {
    pub fn create(repository: Box<dyn AsyncRepositoryTrait<SubscriptionStatusReadModel>>) -> Self {
        Self {
            name: "SubscriptionStatusReadModelProjector".to_string(),
            cache_key: "read_model_cache:SubscriptionStatusReadModelProjector".to_string(),
            repository,
        }
    }

    fn project_event(
        &self,
        model: Option<SubscriptionStatusReadModel>,
        envelope: &EventEnvelope<LabourEvent>,
    ) -> Option<SubscriptionStatusReadModel> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            LabourEvent::SubscriberRequested(e) if model.is_none() => {
                Some(SubscriptionStatusReadModel::new(
                    e.labour_id,
                    e.subscription_id,
                    e.subscriber_id.clone(),
                    SubscriberStatus::REQUESTED,
                    timestamp,
                ))
            }

            LabourEvent::SubscriberApproved(_) => {
                let mut subscription = model?;
                subscription.status = SubscriberStatus::SUBSCRIBED;
                Some(subscription)
            }

            LabourEvent::SubscriberRemoved(_) => {
                let mut subscription = model?;
                subscription.status = SubscriberStatus::REMOVED;
                Some(subscription)
            }

            LabourEvent::SubscriberBlocked(_) => {
                let mut subscription = model?;
                subscription.status = SubscriberStatus::BLOCKED;
                Some(subscription)
            }

            LabourEvent::SubscriberUnblocked(_) => {
                let mut subscription = model?;
                subscription.status = SubscriberStatus::REMOVED;
                Some(subscription)
            }

            LabourEvent::SubscriberUnsubscribed(_) => {
                let mut subscription = model?;
                subscription.status = SubscriberStatus::UNSUBSCRIBED;
                Some(subscription)
            }

            LabourEvent::LabourDeleted(_) => None,

            _ => model,
        }
    }
}

#[async_trait(?Send)]
impl IncrementalAsyncProjector<LabourEvent> for SubscriptionStatusReadModelProjector {
    fn name(&self) -> &str {
        &self.name
    }

    fn get_cached_sequence(&self, cache: &Rc<dyn CacheTrait>) -> i64 {
        cache
            .get::<CachedReadModelState<SubscriptionStatusReadModel>>(self.cache_key.clone())
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
        let cached_state: CachedReadModelState<SubscriptionStatusReadModel> = cache
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

        if before != current_model {
            match (&before, &current_model) {
                (Some(old_model), None) => {
                    info!(projector = %self.name, "Model deleted, removing from D1");
                    self.repository
                        .delete(old_model.subscription_id)
                        .await
                        .map_err(|e| anyhow!("Failed to delete: {e}"))?;
                }
                (_, Some(new_model)) => {
                    info!(projector = %self.name, "Model changed, persisting to D1");
                    self.repository
                        .overwrite(new_model)
                        .await
                        .map_err(|e| anyhow!("Failed to persist: {e}"))?;
                }
                (None, None) => {}
            }
        }

        let new_state = CachedReadModelState::new(max_sequence, current_model);
        if let Err(e) = cache.set(self.cache_key.clone(), &new_state) {
            warn!(projector = %self.name, error = %e, "Failed to update cache");
        }

        Ok(())
    }
}
