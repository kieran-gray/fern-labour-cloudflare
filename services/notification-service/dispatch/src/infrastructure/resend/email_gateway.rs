use anyhow::{Result, anyhow};
use async_trait::async_trait;
use chrono::{DateTime, SecondsFormat, Utc};
use fern_labour_notifications_shared::value_objects::NotificationChannel;
use resend_rs::{Resend, types::CreateEmailBaseOptions};
use tracing::{error, info};

use crate::{
    application::dispatch::{
        DispatchContext, NotificationGatewayTrait, ScheduleContext,
        gateway::{DispatchResult, ScheduleResult},
    },
    setup::config::ResendConfig,
};

pub struct ResendEmailNotificationGateway {
    pub config: ResendConfig,
}

impl ResendEmailNotificationGateway {
    pub fn create(config: &ResendConfig) -> Self {
        Self {
            config: config.clone(),
        }
    }

    async fn send_email(
        &self,
        notification_id: uuid::Uuid,
        destination: &str,
        subject: &str,
        body: &str,
        idempotency_key: &str,
        scheduled_at: Option<DateTime<Utc>>,
    ) -> Result<DispatchResult> {
        let resend = Resend::new(&self.config.api_key);
        let from = format!("{} <{}>", self.config.from_name, self.config.from_email);

        let mut email = CreateEmailBaseOptions::new(from, [destination], subject).with_html(body);

        if let Some(scheduled_at) = scheduled_at {
            let scheduled_at = scheduled_at.to_rfc3339_opts(SecondsFormat::Millis, true);
            email = email.with_scheduled_at(&scheduled_at);
        }

        let email = email.with_idempotency_key(idempotency_key);

        match resend.emails.send(email).await {
            Ok(response) => {
                info!(
                    notification_id = %notification_id,
                    external_id = %response.id,
                    "Email sent successfully via Resend"
                );
                Ok(DispatchResult::Tracked {
                    external_id: response.id.to_string(),
                    provider: self.provider().to_string(),
                })
            }
            Err(err) => {
                error!(
                    notification_id = %notification_id,
                    error = %err,
                    "Failed to send email via Resend"
                );
                Err(anyhow!(err))
            }
        }
    }
}

#[async_trait(?Send)]
impl NotificationGatewayTrait for ResendEmailNotificationGateway {
    fn channel(&self) -> NotificationChannel {
        NotificationChannel::EMAIL
    }

    fn provider(&self) -> &str {
        "resend"
    }

    async fn dispatch(&self, context: &DispatchContext) -> Result<DispatchResult> {
        self.send_email(
            context.notification_id,
            context.destination.as_str(),
            context.content.subject().unwrap(),
            context.content.body(),
            &context.idempotency_key,
            None,
        )
        .await
    }

    async fn schedule(&self, context: &ScheduleContext) -> Result<ScheduleResult> {
        self.send_email(
            context.notification_id,
            context.destination.as_str(),
            context.content.subject().unwrap(),
            context.content.body(),
            &context.idempotency_key,
            Some(context.scheduled_at),
        )
        .await
    }

    async fn redact(&self, _external_id: String) -> Result<bool> {
        // Resend does not support email message body redaction
        Ok(false)
    }
}
