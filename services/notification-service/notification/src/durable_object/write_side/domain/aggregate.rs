use std::{collections::HashMap, fmt::Debug};

use fern_labour_notifications_shared::{
    NotificationCommand,
    value_objects::{
        NotificationChannel, NotificationDestination, NotificationStatus, NotificationTemplateData,
        RenderedContent, ScheduledAt,
    },
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use fern_labour_event_sourcing_rs::Aggregate;

use crate::durable_object::write_side::domain::{
    NotificationContentRedacted, NotificationDeleted, NotificationError, NotificationEvent,
    NotificationScheduled,
    events::{
        NotificationDelivered, NotificationDeliveryFailed, NotificationDispatched,
        NotificationRequested, RenderedContentStored,
    },
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    id: Uuid,
    status: NotificationStatus,
    channel: NotificationChannel,
    destination: NotificationDestination,
    template_data: NotificationTemplateData,
    scheduled_at: Option<ScheduledAt>,
    metadata: Option<HashMap<String, String>>,
    external_id: Option<String>,
    sent_via_provider: Option<String>,
    rendered_content: Option<RenderedContent>,
    failure_reason: Option<String>,
}

impl Notification {
    pub fn id(&self) -> Uuid {
        self.id
    }

    pub fn status(&self) -> &NotificationStatus {
        &self.status
    }

    pub fn channel(&self) -> &NotificationChannel {
        &self.channel
    }

    pub fn destination(&self) -> &NotificationDestination {
        &self.destination
    }

    pub fn template_data(&self) -> &NotificationTemplateData {
        &self.template_data
    }

    pub fn scheduled_at(&self) -> Option<&ScheduledAt> {
        self.scheduled_at.as_ref()
    }

    pub fn metadata(&self) -> Option<&HashMap<String, String>> {
        self.metadata.as_ref()
    }

    pub fn external_id(&self) -> Option<&String> {
        self.external_id.as_ref()
    }

    pub fn rendered_content(&self) -> Option<&RenderedContent> {
        self.rendered_content.as_ref()
    }

    pub fn failure_reason(&self) -> Option<&String> {
        self.failure_reason.as_ref()
    }
}

impl Aggregate for Notification {
    type Command = NotificationCommand;
    type Error = NotificationError;
    type Event = NotificationEvent;

    fn aggregate_id(&self) -> String {
        self.id.to_string()
    }

    fn apply(&mut self, event: &Self::Event) {
        match event {
            NotificationEvent::NotificationRequested(e) => {
                self.id = e.notification_id;
                self.channel = e.channel.clone();
                self.destination = e.destination.clone();
                self.template_data = e.template_data.clone();
                self.scheduled_at = e.scheduled_at.clone();
                self.metadata = e.metadata.clone();
                self.status = NotificationStatus::REQUESTED;
            }
            NotificationEvent::RenderedContentStored(e) => {
                self.rendered_content = Some(e.rendered_content.clone());
                self.status = NotificationStatus::RENDERED;
            }
            NotificationEvent::NotificationScheduled(e) => {
                self.external_id = e.external_id.clone();
                self.sent_via_provider = Some(e.provider.clone());
                self.status = NotificationStatus::SCHEDULED;
            }
            NotificationEvent::NotificationDispatched(e) => {
                self.external_id = e.external_id.clone();
                self.status = NotificationStatus::SENT;
            }
            NotificationEvent::NotificationDelivered(_) => {
                self.status = NotificationStatus::DELIVERED;
            }
            NotificationEvent::NotificationDeliveryFailed(e) => {
                self.status = NotificationStatus::FAILED;
                self.failure_reason = e.reason.clone();
            }
            NotificationEvent::NotificationContentRedacted(_) => {
                self.status = NotificationStatus::REDACTED;
            }
            NotificationEvent::NotificationDeleted(_) => {
                self.status = NotificationStatus::DELETED;
            }
        }
    }

    fn handle_command(
        state: Option<&Self>,
        command: Self::Command,
    ) -> std::result::Result<Vec<Self::Event>, Self::Error> {
        let events = match command {
            NotificationCommand::RequestNotification {
                notification_id,
                channel,
                destination,
                template_data,
                scheduled_at,
                metadata,
            } => {
                if state.is_some() {
                    return Err(NotificationError::AlreadyExists);
                }
                if !destination.matches_channel(&channel) {
                    return Err(NotificationError::ValidationError(format!(
                        "Destination channel {} does not match notification channel {}",
                        destination.channel(),
                        channel
                    )));
                }

                vec![NotificationEvent::NotificationRequested(
                    NotificationRequested {
                        notification_id,
                        channel: channel.clone(),
                        destination,
                        template_data: template_data.clone(),
                        scheduled_at,
                        metadata,
                    },
                )]
            }
            NotificationCommand::StoreRenderedContent {
                notification_id,
                rendered_content,
            } => {
                let Some(notification) = &state else {
                    return Err(NotificationError::NotFound);
                };

                if notification.status != NotificationStatus::REQUESTED {
                    return Err(NotificationError::InvalidStateTransition(
                        "Cannot store template for notification not in REQUESTED state".to_string(),
                    ));
                }

                if rendered_content.channel() != notification.channel.to_string() {
                    return Err(NotificationError::ValidationError(
                        "Rendered content channel doesn't match notification channel".to_string(),
                    ));
                }

                vec![NotificationEvent::RenderedContentStored(
                    RenderedContentStored {
                        notification_id,
                        rendered_content: rendered_content.clone(),
                    },
                )]
            }
            NotificationCommand::MarkAsScheduled {
                notification_id,
                provider,
                external_id,
            } => {
                let Some(notification) = &state else {
                    return Err(NotificationError::NotFound);
                };

                if ![NotificationStatus::RENDERED, NotificationStatus::FAILED]
                    .contains(&notification.status)
                {
                    return Err(NotificationError::InvalidStateTransition(
                        "Cannot schedule notification in current state".to_string(),
                    ));
                }

                vec![NotificationEvent::NotificationScheduled(
                    NotificationScheduled {
                        notification_id,
                        external_id,
                        provider,
                    },
                )]
            }
            NotificationCommand::MarkAsDispatched {
                notification_id,
                sent_via_provider,
                external_id,
            } => {
                let Some(notification) = &state else {
                    return Err(NotificationError::NotFound);
                };

                if ![NotificationStatus::RENDERED, NotificationStatus::FAILED]
                    .contains(&notification.status)
                {
                    return Err(NotificationError::InvalidStateTransition(
                        "Cannot dispatch notification in current state".to_string(),
                    ));
                }

                vec![NotificationEvent::NotificationDispatched(
                    NotificationDispatched {
                        notification_id,
                        external_id,
                        sent_via_provider,
                    },
                )]
            }
            NotificationCommand::MarkAsDelivered {
                notification_id,
                provider,
            } => {
                let Some(notification) = &state else {
                    return Err(NotificationError::NotFound);
                };

                if ![NotificationStatus::SENT, NotificationStatus::SCHEDULED]
                    .contains(&notification.status)
                {
                    return Err(NotificationError::InvalidStateTransition(
                        "Cannot mark as delivered if not in SENT or SCHEDULED state".to_string(),
                    ));
                }

                let Some(external_id) = notification.external_id.clone() else {
                    return Err(NotificationError::InvalidStateTransition(
                        "Cannot mark as delivered, no external ID".to_string(),
                    ));
                };

                vec![NotificationEvent::NotificationDelivered(
                    NotificationDelivered {
                        notification_id,
                        external_id,
                        provider,
                    },
                )]
            }
            NotificationCommand::MarkAsFailed {
                notification_id,
                reason,
                provider,
            } => {
                let Some(notification) = &state else {
                    return Err(NotificationError::NotFound);
                };

                let Some(external_id) = notification.external_id.clone() else {
                    return Err(NotificationError::InvalidStateTransition(
                        "Cannot mark as failed, no external ID".to_string(),
                    ));
                };

                if ![NotificationStatus::SENT, NotificationStatus::SCHEDULED]
                    .contains(&notification.status)
                {
                    return Err(NotificationError::InvalidStateTransition(
                        "Can only mark as failed from SENT or SCHEDULED state".to_string(),
                    ));
                }

                vec![NotificationEvent::NotificationDeliveryFailed(
                    NotificationDeliveryFailed {
                        notification_id,
                        external_id,
                        reason,
                        provider,
                    },
                )]
            }
            NotificationCommand::MarkContentRedacted { notification_id } => {
                let Some(notification) = &state else {
                    return Err(NotificationError::NotFound);
                };

                if NotificationStatus::DELIVERED != notification.status {
                    return Err(NotificationError::InvalidStateTransition(
                        "Can only redact content from DELIVERED state".to_string(),
                    ));
                }

                vec![NotificationEvent::NotificationContentRedacted(
                    NotificationContentRedacted { notification_id },
                )]
            }
            NotificationCommand::DeleteNotification { notification_id } => {
                let Some(notification) = &state else {
                    return Err(NotificationError::NotFound);
                };

                if ![NotificationStatus::DELIVERED, NotificationStatus::REDACTED]
                    .contains(&notification.status)
                {
                    return Err(NotificationError::InvalidStateTransition(
                        "Cannot delete notification in current state".to_string(),
                    ));
                }

                vec![NotificationEvent::NotificationDeleted(
                    NotificationDeleted { notification_id },
                )]
            }
        };
        Ok(events)
    }

    fn from_events(events: &[Self::Event]) -> Option<Self> {
        let mut notification = match events.first() {
            Some(NotificationEvent::NotificationRequested(e)) => Notification {
                id: e.notification_id,
                status: NotificationStatus::REQUESTED,
                channel: e.channel.clone(),
                destination: e.destination.clone(),
                template_data: e.template_data.clone(),
                scheduled_at: e.scheduled_at.clone(),
                metadata: e.metadata.clone(),
                external_id: None,
                sent_via_provider: None,
                rendered_content: None,
                failure_reason: None,
            },
            _ => return None,
        };

        for event in events.iter().skip(1) {
            notification.apply(event);
        }

        Some(notification)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};
    use fern_labour_notifications_shared::value_objects::EmailAddress;

    fn create_test_notification_id() -> Uuid {
        Uuid::now_v7()
    }

    fn create_test_data() -> NotificationTemplateData {
        NotificationTemplateData::ContactUs {
            name: "John Doe".to_string(),
        }
    }

    fn create_test_destination() -> NotificationDestination {
        NotificationDestination::Email(EmailAddress::new("test@example.com").unwrap())
    }

    #[test]
    fn test_request_notification_creates_events() {
        let notification_id = create_test_notification_id();
        let data = create_test_data();

        let command = NotificationCommand::RequestNotification {
            notification_id,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: data.clone(),
            scheduled_at: None,
            metadata: None,
        };

        let events = Notification::handle_command(None, command).unwrap();

        assert!(matches!(
            events[0],
            NotificationEvent::NotificationRequested { .. }
        ));
    }

    #[test]
    fn test_request_notification_with_scheduled_at_creates_event() {
        let notification_id = create_test_notification_id();
        let data = create_test_data();
        let now = Utc::now();
        let scheduled_at = ScheduledAt::new_with_now(now + Duration::minutes(31), now).unwrap();

        let command = NotificationCommand::RequestNotification {
            notification_id,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: data,
            scheduled_at: Some(scheduled_at.clone()),
            metadata: None,
        };

        let events = Notification::handle_command(None, command).unwrap();

        assert_eq!(events.len(), 1);
        match &events[0] {
            NotificationEvent::NotificationRequested(e) => {
                assert_eq!(e.scheduled_at, Some(scheduled_at));
            }
            _ => panic!("Expected NotificationRequested event"),
        }
    }

    #[test]
    fn test_request_notification_when_already_exists_fails() {
        let notification_id = create_test_notification_id();
        let data = create_test_data();

        let existing = Notification {
            id: notification_id,
            status: NotificationStatus::REQUESTED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: data.clone(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: None,
            failure_reason: None,
        };

        let command = NotificationCommand::RequestNotification {
            notification_id,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: data,
            scheduled_at: None,
            metadata: None,
        };

        let result = Notification::handle_command(Some(&existing), command);

        assert!(matches!(result, Err(NotificationError::AlreadyExists)));
    }

    #[test]
    fn test_store_rendered_content_in_requested_state() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::REQUESTED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: None,
            failure_reason: None,
        };

        let command = NotificationCommand::StoreRenderedContent {
            notification_id,
            rendered_content: RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            },
        };

        let events = Notification::handle_command(Some(&notification), command).unwrap();

        assert!(matches!(
            events[0],
            NotificationEvent::RenderedContentStored { .. }
        ));
    }

    #[test]
    fn test_store_rendered_content_in_wrong_state_fails() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::SENT,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: Some("ext-123".to_string()),
            sent_via_provider: None,
            rendered_content: None,
            failure_reason: None,
        };

        let command = NotificationCommand::StoreRenderedContent {
            notification_id,
            rendered_content: RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            },
        };

        let result = Notification::handle_command(Some(&notification), command);

        assert!(matches!(
            result,
            Err(NotificationError::InvalidStateTransition(_))
        ));
    }

    #[test]
    fn test_mark_as_dispatched() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::RENDERED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsDispatched {
            notification_id,
            sent_via_provider: "twilio".to_string(),
            external_id: Some("ext-123".to_string()),
        };

        let events = Notification::handle_command(Some(&notification), command).unwrap();

        assert_eq!(events.len(), 1);
        assert!(matches!(
            events[0],
            NotificationEvent::NotificationDispatched(NotificationDispatched {
                external_id: Some(_),
                ..
            })
        ));
    }

    #[test]
    fn test_mark_as_dispatched_when_already_sent_fails() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::SENT,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: Some("ext-123".to_string()),
            sent_via_provider: None,
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsDispatched {
            notification_id,
            sent_via_provider: "twilio".to_string(),
            external_id: Some("ext-456".to_string()),
        };

        let result = Notification::handle_command(Some(&notification), command);

        assert!(matches!(
            result,
            Err(NotificationError::InvalidStateTransition(_))
        ));
    }

    #[test]
    fn test_mark_as_scheduled() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::RENDERED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsScheduled {
            notification_id,
            provider: "twilio".to_string(),
            external_id: Some("sch-123".to_string()),
        };

        let events = Notification::handle_command(Some(&notification), command).unwrap();

        assert_eq!(events.len(), 1);
        assert!(matches!(
            events[0],
            NotificationEvent::NotificationScheduled(NotificationScheduled {
                external_id: Some(_),
                ..
            })
        ));
    }

    #[test]
    fn test_mark_as_scheduled_from_wrong_state_fails() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::REQUESTED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: None,
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsScheduled {
            notification_id,
            provider: "twilio".to_string(),
            external_id: Some("sch-123".to_string()),
        };

        let result = Notification::handle_command(Some(&notification), command);

        assert!(matches!(
            result,
            Err(NotificationError::InvalidStateTransition(_))
        ));
    }

    #[test]
    fn test_mark_as_delivered() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::SENT,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: Some("ext-123".to_string()),
            sent_via_provider: None,
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsDelivered {
            notification_id,
            provider: "Test".to_string(),
        };

        let events = Notification::handle_command(Some(&notification), command).unwrap();

        assert_eq!(events.len(), 1);
        assert!(matches!(
            events[0],
            NotificationEvent::NotificationDelivered { .. }
        ));
    }

    #[test]
    fn test_mark_as_delivered_from_scheduled() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::SCHEDULED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: Some("sch-123".to_string()),
            sent_via_provider: Some("twilio".to_string()),
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsDelivered {
            notification_id,
            provider: "twilio".to_string(),
        };

        let events = Notification::handle_command(Some(&notification), command).unwrap();

        assert_eq!(events.len(), 1);
        assert!(matches!(
            events[0],
            NotificationEvent::NotificationDelivered { .. }
        ));
    }

    #[test]
    fn test_mark_as_delivered_from_wrong_state_fails() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::REQUESTED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: None,
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsDelivered {
            notification_id,
            provider: "Test".to_string(),
        };

        let result = Notification::handle_command(Some(&notification), command);

        assert!(matches!(
            result,
            Err(NotificationError::InvalidStateTransition(_))
        ));
    }

    #[test]
    fn test_mark_as_delivered_without_external_id_fails() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::SENT,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsDelivered {
            notification_id,
            provider: "Test".to_string(),
        };

        let result = Notification::handle_command(Some(&notification), command);

        assert!(matches!(
            result,
            Err(NotificationError::InvalidStateTransition(_))
        ));
    }

    #[test]
    fn test_mark_as_failed() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::SENT,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: Some("ext-123".to_string()),
            sent_via_provider: None,
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsFailed {
            notification_id,
            reason: Some("Something went wrong".to_string()),
            provider: "Test".to_string(),
        };

        let events = Notification::handle_command(Some(&notification), command).unwrap();

        assert_eq!(events.len(), 1);
        assert!(matches!(
            events[0],
            NotificationEvent::NotificationDeliveryFailed { .. }
        ));
    }

    #[test]
    fn test_mark_as_failed_from_scheduled() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::SCHEDULED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: Some("sch-123".to_string()),
            sent_via_provider: Some("twilio".to_string()),
            rendered_content: Some(RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into(),
            }),
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsFailed {
            notification_id,
            reason: Some("Something went wrong".to_string()),
            provider: "twilio".to_string(),
        };

        let events = Notification::handle_command(Some(&notification), command).unwrap();

        assert_eq!(events.len(), 1);
        assert!(matches!(
            events[0],
            NotificationEvent::NotificationDeliveryFailed { .. }
        ));
    }

    #[test]
    fn test_mark_as_failed_without_external_id_fails() {
        let notification_id = create_test_notification_id();

        let notification = Notification {
            id: notification_id,
            status: NotificationStatus::REQUESTED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: create_test_data(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: None,
            failure_reason: None,
        };

        let command = NotificationCommand::MarkAsFailed {
            notification_id,
            reason: Some("Something went wrong".to_string()),
            provider: "Test".to_string(),
        };

        let result = Notification::handle_command(Some(&notification), command);

        assert!(matches!(
            result,
            Err(NotificationError::InvalidStateTransition(_))
        ));
    }

    #[test]
    fn test_from_events_rebuilds_state() {
        let notification_id = create_test_notification_id();
        let data = create_test_data();

        let events = vec![
            NotificationEvent::NotificationRequested(NotificationRequested {
                notification_id,
                channel: NotificationChannel::EMAIL,
                destination: create_test_destination(),
                template_data: data.clone(),
                scheduled_at: None,
                metadata: None,
            }),
            NotificationEvent::RenderedContentStored(RenderedContentStored {
                notification_id,
                rendered_content: RenderedContent::Email {
                    subject: "Test Subject".into(),
                    html_body: "<h1>TestBody</h1>".into(),
                },
            }),
            NotificationEvent::NotificationDispatched(NotificationDispatched {
                notification_id,
                sent_via_provider: "test".to_string(),
                external_id: Some("ext-123".to_string()),
            }),
        ];

        let notification = Notification::from_events(&events).unwrap();

        assert_eq!(notification.id(), notification_id);
        assert_eq!(notification.status(), &NotificationStatus::SENT);
        assert_eq!(notification.channel(), &NotificationChannel::EMAIL);
        assert_eq!(notification.destination().as_str(), "test@example.com");
        assert_eq!(
            notification.rendered_content(),
            Some(&RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into()
            })
        );
        assert_eq!(notification.external_id(), Some(&"ext-123".to_string()));
    }

    #[test]
    fn test_apply_events_in_sequence() {
        let notification_id = create_test_notification_id();
        let data = create_test_data();

        let mut notification = Notification {
            id: notification_id,
            status: NotificationStatus::REQUESTED,
            channel: NotificationChannel::EMAIL,
            destination: create_test_destination(),
            template_data: data.clone(),
            scheduled_at: None,
            metadata: None,
            external_id: None,
            sent_via_provider: None,
            rendered_content: None,
            failure_reason: None,
        };

        notification.apply(&NotificationEvent::RenderedContentStored(
            RenderedContentStored {
                notification_id,
                rendered_content: RenderedContent::Email {
                    subject: "Test Subject".into(),
                    html_body: "<h1>TestBody</h1>".into(),
                },
            },
        ));
        assert_eq!(
            notification.rendered_content(),
            Some(&RenderedContent::Email {
                subject: "Test Subject".into(),
                html_body: "<h1>TestBody</h1>".into()
            })
        );

        notification.apply(&NotificationEvent::NotificationDispatched(
            NotificationDispatched {
                notification_id,
                sent_via_provider: "test".to_string(),
                external_id: Some("ext-123".to_string()),
            },
        ));
        assert_eq!(notification.status(), &NotificationStatus::SENT);
        assert_eq!(notification.external_id(), Some(&"ext-123".to_string()));

        notification.apply(&NotificationEvent::NotificationDelivered(
            NotificationDelivered {
                notification_id,
                external_id: "ext-123".to_string(),
                provider: "Test".to_string(),
            },
        ));
        assert_eq!(notification.status(), &NotificationStatus::DELIVERED);

        notification.apply(&NotificationEvent::NotificationContentRedacted(
            NotificationContentRedacted { notification_id },
        ));
        assert_eq!(notification.status(), &NotificationStatus::REDACTED);

        notification.apply(&NotificationEvent::NotificationDeleted(
            NotificationDeleted { notification_id },
        ));
        assert_eq!(notification.status(), &NotificationStatus::DELETED);
    }
}
