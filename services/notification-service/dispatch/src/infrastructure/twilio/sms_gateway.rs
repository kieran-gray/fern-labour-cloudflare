use anyhow::Result;
use async_trait::async_trait;
use chrono::{DateTime, SecondsFormat, Utc};
use fern_labour_notifications_shared::value_objects::NotificationChannel;
use tracing::info;

use super::client::TwilioClient;
use crate::{
    application::dispatch::{
        DispatchContext, NotificationGatewayTrait, ScheduleContext,
        gateway::{DispatchResult, ScheduleResult},
    },
    setup::config::TwilioConfig,
};

pub struct TwilioSmsNotificationGateway {
    client: TwilioClient,
}

impl TwilioSmsNotificationGateway {
    pub fn create(twilio_config: &TwilioConfig) -> Self {
        Self {
            client: TwilioClient::new(twilio_config),
        }
    }

    fn form_data(
        &self,
        destination: &str,
        body: &str,
        scheduled_at: Option<&DateTime<Utc>>,
    ) -> String {
        let mut serializer = form_urlencoded::Serializer::new(String::new());
        serializer
            .append_pair("To", destination)
            .append_pair("Body", body)
            .append_pair("MessagingServiceSid", self.client.messaging_service_sid());

        if let Some(scheduled_at) = scheduled_at {
            let send_at = scheduled_at.to_rfc3339_opts(SecondsFormat::Secs, true);
            serializer
                .append_pair("ScheduleType", "fixed")
                .append_pair("SendAt", &send_at);
        }

        serializer.finish()
    }
}

#[async_trait(?Send)]
impl NotificationGatewayTrait for TwilioSmsNotificationGateway {
    fn channel(&self) -> NotificationChannel {
        NotificationChannel::SMS
    }

    fn provider(&self) -> &str {
        "twilio"
    }

    async fn dispatch(&self, context: &DispatchContext) -> Result<DispatchResult> {
        let form_data = self.form_data(context.destination.as_str(), context.content.body(), None);

        let message_sid = self
            .client
            .send_message(context.notification_id, form_data)
            .await?;

        info!(
            notification_id = %context.notification_id,
            message_sid = %message_sid,
            "Successfully sent SMS via Twilio"
        );
        Ok(DispatchResult::Tracked {
            external_id: message_sid,
            provider: self.provider().to_string(),
        })
    }

    async fn schedule(&self, context: &ScheduleContext) -> Result<ScheduleResult> {
        let form_data = self.form_data(
            context.destination.as_str(),
            context.content.body(),
            Some(&context.scheduled_at),
        );

        let message_sid = self
            .client
            .send_message(context.notification_id, form_data)
            .await?;

        info!(
            notification_id = %context.notification_id,
            message_sid = %message_sid,
            "Successfully scheduled SMS via Twilio"
        );
        Ok(ScheduleResult::Tracked {
            external_id: message_sid,
            provider: self.provider().to_string(),
        })
    }

    async fn redact(&self, external_id: String) -> Result<bool> {
        let form_data = form_urlencoded::Serializer::new(String::new())
            .append_pair("Body", "")
            .finish();

        self.client
            .redact_message_content(external_id, form_data)
            .await?;

        Ok(true)
    }
}
