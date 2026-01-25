use anyhow::Result;
use async_trait::async_trait;
use fern_labour_notifications_shared::value_objects::NotificationChannel;
use tracing::info;

use super::client::TwilioClient;
use crate::{
    application::dispatch::{DispatchContext, NotificationGatewayTrait, gateway::DispatchResult},
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
        let form_data = form_urlencoded::Serializer::new(String::new())
            .append_pair("To", context.destination.as_str())
            .append_pair("Body", context.content.body())
            .append_pair("MessagingServiceSid", self.client.messaging_service_sid())
            .finish();

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
