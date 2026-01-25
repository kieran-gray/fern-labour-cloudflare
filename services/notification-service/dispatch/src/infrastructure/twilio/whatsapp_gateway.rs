use anyhow::Result;
use async_trait::async_trait;
use fern_labour_notifications_shared::value_objects::NotificationChannel;
use tracing::info;

use super::client::TwilioClient;
use crate::{
    application::dispatch::{DispatchContext, NotificationGatewayTrait, gateway::DispatchResult},
    setup::config::TwilioConfig,
};

pub struct TwilioWhatsappNotificationGateway {
    client: TwilioClient,
}

impl TwilioWhatsappNotificationGateway {
    pub fn create(twilio_config: &TwilioConfig) -> Self {
        Self {
            client: TwilioClient::new(twilio_config),
        }
    }
}

#[async_trait(?Send)]
impl NotificationGatewayTrait for TwilioWhatsappNotificationGateway {
    fn channel(&self) -> NotificationChannel {
        NotificationChannel::WHATSAPP
    }

    fn provider(&self) -> &str {
        "twilio"
    }

    async fn dispatch(&self, context: &DispatchContext) -> Result<DispatchResult> {
        let Some(template_sid) = context.content.subject() else {
            anyhow::bail!("No Template SID found");
        };

        let form_data = form_urlencoded::Serializer::new(String::new())
            .append_pair("To", &format!("whatsapp:{}", context.destination.as_str()))
            .append_pair("ContentSid", template_sid)
            .append_pair("ContentVariables", context.content.body())
            .append_pair("MessagingServiceSid", self.client.messaging_service_sid())
            .finish();

        let message_sid = self
            .client
            .send_message(context.notification_id, form_data)
            .await?;

        info!(
            notification_id = %context.notification_id,
            message_sid = %message_sid,
            "Successfully sent WhatsApp via Twilio"
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
