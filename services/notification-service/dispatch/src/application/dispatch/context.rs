use chrono::{DateTime, Utc};
use fern_labour_notifications_shared::service_clients::DispatchRequest;
use fern_labour_notifications_shared::service_clients::dispatch::requests::ScheduleRequest;
use fern_labour_notifications_shared::value_objects::{
    NotificationChannel, NotificationDestination, RenderedContent,
};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct DispatchContext {
    pub notification_id: Uuid,
    pub destination: NotificationDestination,
    pub content: RenderedContent,
    pub idempotency_key: String,
}

impl DispatchContext {
    pub fn validate(&self) -> Result<(), DispatchValidationError> {
        validate_channel_match(&self.destination, &self.content)
    }

    pub fn channel(&self) -> NotificationChannel {
        self.destination.channel()
    }
}

impl From<DispatchRequest> for DispatchContext {
    fn from(request: DispatchRequest) -> Self {
        Self {
            notification_id: request.notification_id,
            destination: request.destination,
            content: request.rendered_content,
            idempotency_key: request.idempotency_key,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ScheduleContext {
    pub notification_id: Uuid,
    pub destination: NotificationDestination,
    pub content: RenderedContent,
    pub scheduled_at: DateTime<Utc>,
    pub idempotency_key: String,
}

impl ScheduleContext {
    pub fn validate(&self) -> Result<(), DispatchValidationError> {
        validate_channel_match(&self.destination, &self.content)
    }

    pub fn channel(&self) -> NotificationChannel {
        self.destination.channel()
    }
}

impl From<ScheduleRequest> for ScheduleContext {
    fn from(request: ScheduleRequest) -> Self {
        Self {
            notification_id: request.notification_id,
            destination: request.destination,
            content: request.rendered_content,
            scheduled_at: request.scheduled_at,
            idempotency_key: request.idempotency_key,
        }
    }
}

#[derive(Debug)]
pub enum DispatchValidationError {
    ChannelMismatch {
        destination: NotificationChannel,
        content: String,
    },
}

impl std::fmt::Display for DispatchValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DispatchValidationError::ChannelMismatch {
                destination,
                content,
            } => {
                write!(
                    f,
                    "Channel mismatch: destination is {} but content is {}",
                    destination, content
                )
            }
        }
    }
}

impl std::error::Error for DispatchValidationError {}

fn validate_channel_match(
    destination: &NotificationDestination,
    content: &RenderedContent,
) -> Result<(), DispatchValidationError> {
    let destination_channel = destination.channel();
    let content_channel_str = content.channel();

    if destination_channel.to_string() != content_channel_str {
        return Err(DispatchValidationError::ChannelMismatch {
            destination: destination_channel,
            content: content_channel_str.to_string(),
        });
    }

    Ok(())
}
