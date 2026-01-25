use anyhow::{Context, Result, anyhow};
use fern_labour_notifications_shared::{
    ServiceCommand,
    service_clients::{
        DispatchClient, DispatchRequest, GenerationClient, dispatch::requests::RedactRequest,
    },
};
use tracing::info;

use crate::durable_object::write_side::domain::NotificationCommand;

pub struct ServiceCommandProcessor {
    generation_client: Box<dyn GenerationClient>,
    dispatch_client: Box<dyn DispatchClient>,
}

impl ServiceCommandProcessor {
    pub fn create(
        generation_client: Box<dyn GenerationClient>,
        dispatch_client: Box<dyn DispatchClient>,
    ) -> Self {
        Self {
            generation_client,
            dispatch_client,
        }
    }

    pub async fn handle(&self, command: ServiceCommand) -> Result<NotificationCommand> {
        match command {
            ServiceCommand::RenderNotification {
                notification_id,
                channel,
                template_data,
            } => {
                let rendered_content = self
                    .generation_client
                    .render(notification_id, channel.clone(), template_data)
                    .await
                    .map_err(|err| anyhow!("Failed to render notification content: {err}"))?;

                Ok(NotificationCommand::StoreRenderedContent {
                    notification_id,
                    rendered_content,
                })
            }
            ServiceCommand::DispatchNotification {
                notification_id,
                channel,
                destination,
                rendered_content,
            } => {
                let request = DispatchRequest {
                    notification_id,
                    channel,
                    destination,
                    rendered_content,
                    idempotency_key: format!("notification-{}", notification_id),
                };

                let response = self
                    .dispatch_client
                    .dispatch(request)
                    .await
                    .context("Failed to dispatch notification")?;

                Ok(NotificationCommand::MarkAsDispatched {
                    notification_id,
                    external_id: response.external_id,
                    sent_via_provider: response.provider,
                })
            }
            ServiceCommand::RedactNotificationContent {
                notification_id,
                external_id,
                provider,
            } => {
                let request = RedactRequest {
                    notification_id,
                    external_id: external_id.clone(),
                    provider,
                };

                let redacted = self
                    .dispatch_client
                    .redact(request)
                    .await
                    .context("Failed to redact notification")?;

                match redacted {
                    true => {
                        info!(notification_id = %notification_id, "Notification content redacted successfully")
                    }
                    false => {
                        info!(notification_id = %notification_id, "Did not redact notification content")
                    }
                }

                Ok(NotificationCommand::MarkContentRedacted { notification_id })
            }
        }
    }
}
