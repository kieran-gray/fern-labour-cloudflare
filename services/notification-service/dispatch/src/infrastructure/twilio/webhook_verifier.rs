use anyhow::{Result, anyhow};
use worker::Headers;

use hmac::{Hmac, Mac};
use sha1::Sha1;

use base64::{Engine, engine::general_purpose::STANDARD};

use crate::application::webhook::WebhookVerifier;

/// Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
pub struct TwilioWebhookVerifier {
    auth_token: String,
    webhook_url: String,
}

impl TwilioWebhookVerifier {
    pub fn create(auth_token: String, webhook_url: String) -> Self {
        Self {
            auth_token,
            webhook_url,
        }
    }
}

impl WebhookVerifier for TwilioWebhookVerifier {
    fn provider_name(&self) -> &str {
        "twilio"
    }

    fn verify(&self, headers: &Headers, body: &[u8]) -> Result<()> {
        let signature = headers
            .get("X-Twilio-Signature")
            .map_err(|_| anyhow!("Failed to read Twilio signature header"))?
            .ok_or_else(|| anyhow!("Missing X-Twilio-Signature header"))?;

        let body_str = String::from_utf8_lossy(body);
        let params: Vec<(String, String)> = form_urlencoded::parse(body_str.as_bytes())
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect();

        let mut sorted_params = params.clone();
        sorted_params.sort_by(|a, b| a.0.cmp(&b.0));

        let mut signature_base = self.webhook_url.clone();
        for (key, value) in sorted_params {
            signature_base.push_str(&key);
            signature_base.push_str(&value);
        }

        let mut mac = Hmac::<Sha1>::new_from_slice(self.auth_token.as_bytes())
            .map_err(|e| anyhow!("Invalid auth token: {}", e))?;
        mac.update(signature_base.as_bytes());

        let result = mac.finalize();
        let expected_signature = STANDARD.encode(result.into_bytes());

        if signature != expected_signature {
            anyhow::bail!("Twilio webhook signature verification failed");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verifier_creation() {
        let verifier = TwilioWebhookVerifier::create(
            "test-token".to_string(),
            "https://example.com/webhook".to_string(),
        );
        assert_eq!(verifier.provider_name(), "twilio");
    }
}
