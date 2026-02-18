use anyhow::{Context, Result};
use async_trait::async_trait;
use tracing::info;

use fern_labour_notifications_shared::value_objects::NotificationStatus as VONotificationStatus;
use fern_labour_event_sourcing_rs::{AsyncProjector, AsyncRepositoryTrait, EventEnvelope};

use crate::durable_object::{
    read_side::read_models::NotificationDetail, write_side::domain::NotificationEvent,
};

pub struct NotificationDetailProjector {
    name: String,
    repository: Box<dyn AsyncRepositoryTrait<NotificationDetail>>,
}

impl NotificationDetailProjector {
    pub fn create(repository: Box<dyn AsyncRepositoryTrait<NotificationDetail>>) -> Self {
        Self {
            name: "NotificationDetailProjector".to_string(),
            repository,
        }
    }

    fn project_event(
        &self,
        model: Option<NotificationDetail>,
        envelope: &EventEnvelope<NotificationEvent>,
    ) -> Option<NotificationDetail> {
        let event = &envelope.event;
        let metadata = &envelope.metadata;
        let timestamp = metadata.timestamp;

        match event {
            NotificationEvent::NotificationRequested(e) if model.is_none() => {
                Some(NotificationDetail::new(
                    metadata.aggregate_id,
                    metadata.user_id.clone(),
                    e.channel.to_string(),
                    e.destination.to_string(),
                    e.template_data.template().to_string(),
                    timestamp,
                ))
            }

            NotificationEvent::RenderedContentStored(e) => {
                let mut detail = model?;
                detail.status = VONotificationStatus::RENDERED.to_string();
                detail.rendered_content = Some(e.rendered_content.clone());
                detail.updated_at = timestamp;
                Some(detail)
            }

            NotificationEvent::NotificationScheduled(e) => {
                let mut detail = model?;
                detail.status = VONotificationStatus::SCHEDULED.to_string();
                detail.external_id = e.external_id.clone();
                detail.dispatched_at = Some(timestamp);
                detail.updated_at = timestamp;
                Some(detail)
            }

            NotificationEvent::NotificationDispatched(e) => {
                let mut detail = model?;
                detail.status = VONotificationStatus::SENT.to_string();
                detail.external_id = e.external_id.clone();
                detail.dispatched_at = Some(timestamp);
                detail.updated_at = timestamp;
                Some(detail)
            }

            NotificationEvent::NotificationDelivered(_) => {
                let mut detail = model?;
                detail.status = VONotificationStatus::DELIVERED.to_string();
                detail.delivered_at = Some(timestamp);
                detail.updated_at = timestamp;
                Some(detail)
            }

            NotificationEvent::NotificationDeliveryFailed(_) => {
                let mut detail = model?;
                detail.status = VONotificationStatus::FAILED.to_string();
                detail.failed_at = Some(timestamp);
                detail.updated_at = timestamp;
                Some(detail)
            }

            NotificationEvent::NotificationContentRedacted(_) => {
                let mut detail = model?;
                detail.status = VONotificationStatus::REDACTED.to_string();
                detail.rendered_content = None;
                detail.updated_at = timestamp;
                Some(detail)
            }

            NotificationEvent::NotificationDeleted { .. } => {
                let mut detail = model?;
                detail.status = VONotificationStatus::DELETED.to_string();
                detail.updated_at = timestamp;
                Some(detail)
            }

            _ => model,
        }
    }
}

#[async_trait(?Send)]
impl AsyncProjector<NotificationEvent> for NotificationDetailProjector {
    fn name(&self) -> &str {
        &self.name
    }

    async fn project_batch(&self, events: &[EventEnvelope<NotificationEvent>]) -> Result<()> {
        if events.is_empty() {
            return Ok(());
        }

        let final_model = events
            .iter()
            .fold(None, |model, envelope| self.project_event(model, envelope));

        if let Some(model) = final_model {
            self.repository
                .overwrite(&model)
                .await
                .context("Failed to persist NotificationDetail")?;

            info!(
                projector = %self.name,
                notification_id = %model.notification_id,
                events_processed = events.len(),
                "Persisted read model after batch processing"
            );
        }

        Ok(())
    }
}
