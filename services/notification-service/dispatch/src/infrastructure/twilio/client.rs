use anyhow::{Context, Result, anyhow};
use base64::{Engine as _, engine::general_purpose};
use tracing::error;
use uuid::Uuid;
use worker::{RequestInit, Response};

use crate::setup::config::TwilioConfig;

pub struct TwilioClient {
    twilio_url: String,
    twilio_auth: String,
    messaging_service_sid: String,
}

impl TwilioClient {
    pub fn new(twilio_config: &TwilioConfig) -> Self {
        let twilio_url = format!(
            "https://api.twilio.com/2010-04-01/Accounts/{}/Messages",
            twilio_config.account_sid
        );

        let credentials = format!("{}:{}", twilio_config.account_sid, twilio_config.auth_token);
        let twilio_auth = format!(
            "Basic {}",
            general_purpose::STANDARD.encode(credentials.as_bytes())
        );

        Self {
            twilio_url,
            twilio_auth,
            messaging_service_sid: twilio_config.messaging_service_sid.clone(),
        }
    }

    pub fn messaging_service_sid(&self) -> &str {
        &self.messaging_service_sid
    }

    fn new_request(&self) -> Result<RequestInit> {
        let mut request_init = worker::RequestInit::new();
        request_init.with_method(worker::Method::Post);

        let headers = worker::Headers::new();
        headers
            .set("Authorization", &self.twilio_auth)
            .context("Failed to set Authorization header")?;
        headers
            .set("Content-Type", "application/x-www-form-urlencoded")
            .context("Failed to set Content-Type header")?;

        request_init.with_headers(headers);
        Ok(request_init)
    }

    async fn post(&self, request: RequestInit, url: &str) -> Result<Response> {
        worker::Fetch::Request(worker::Request::new_with_init(url, &request)?)
            .send()
            .await
            .map_err(|e| anyhow!("Twilio API request failed: {e}"))
    }

    pub async fn send_message(&self, notification_id: Uuid, form_data: String) -> Result<String> {
        let mut request_init = self.new_request()?;
        request_init.with_body(Some(form_data.into()));

        let mut response = self
            .post(request_init, &format!("{}.json", self.twilio_url))
            .await?;

        let status = response.status_code();
        if !(200..=299).contains(&status) {
            let error_text = response
                .text()
                .await
                .context("Failed to read error response")?;

            error!(
                notification_id = %notification_id,
                status = status,
                error = %error_text,
                "Twilio API error"
            );
            anyhow::bail!("Twilio API error (status {}): {}", status, error_text);
        }

        let response_json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| anyhow!("Failed to parse Twilio response: {e}"))?;

        let message_sid = response_json["sid"]
            .as_str()
            .ok_or_else(|| anyhow!("No 'sid' field in Twilio response"))?
            .to_string();

        Ok(message_sid)
    }

    pub async fn redact_message_content(
        &self,
        message_sid: String,
        form_data: String,
    ) -> Result<()> {
        let mut request_init = self.new_request()?;
        request_init.with_body(Some(form_data.into()));

        let mut response = self
            .post(
                request_init,
                &format!("{}/{}.json", self.twilio_url, message_sid),
            )
            .await?;

        let status = response.status_code();
        if !(200..=299).contains(&status) {
            let error_text = response
                .text()
                .await
                .context("Failed to read error response")?;

            error!(status = status, error = %error_text, "Twilio API error");
            anyhow::bail!("Twilio API error (status {}): {}", status, error_text);
        }

        // We assume that the message will be redacted. The operation appears to be
        // eventually consistence on the twilio side, so the updated message resource
        // will not be in the response.

        Ok(())
    }
}
