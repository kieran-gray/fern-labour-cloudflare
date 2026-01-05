use anyhow::Result;
use async_trait::async_trait;

use fern_labour_event_sourcing_rs::{EventEnvelope, SyncProjector, SyncRepositoryTrait};

use crate::durable_object::{
    read_side::read_models::subscription_token::SubscriptionTokenReadModel,
    write_side::domain::LabourEvent,
};

pub struct SubscriptionTokenProjector {
    name: String,
    repository: Box<dyn SyncRepositoryTrait<SubscriptionTokenReadModel>>,
}

impl SubscriptionTokenProjector {
    pub fn create(repository: Box<dyn SyncRepositoryTrait<SubscriptionTokenReadModel>>) -> Self {
        Self {
            name: "SubscriptionTokenReadModelProjector".to_string(),
            repository,
        }
    }

    fn project_event(&self, envelope: &EventEnvelope<LabourEvent>) -> Result<()> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            LabourEvent::SubscriptionTokenSet(e) => {
                let token_read_model =
                    SubscriptionTokenReadModel::new(e.labour_id, e.token.clone(), timestamp);
                self.repository.overwrite(&token_read_model)
            }
            LabourEvent::SubscriptionTokenInvalidated(e) => self.repository.delete(e.labour_id),
            _ => Ok(()),
        }
    }
}

#[async_trait(?Send)]
impl SyncProjector<LabourEvent> for SubscriptionTokenProjector {
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
