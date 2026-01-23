use anyhow::{Context, Result, anyhow};
use base64::{Engine, engine::general_purpose::STANDARD};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use worker::Headers;

use crate::application::webhook::WebhookVerifier;

/// Reference: https://docs.svix.com/receiving/verifying-payloads/how-manual
pub struct ResendWebhookVerifier {
    signing_secret: String,
}

impl ResendWebhookVerifier {
    pub fn create(signing_secret: String) -> Self {
        Self { signing_secret }
    }
}

impl WebhookVerifier for ResendWebhookVerifier {
    fn provider_name(&self) -> &str {
        "resend"
    }

    fn verify(&self, headers: &Headers, body: &[u8]) -> Result<()> {
        let svix_id = headers
            .get("svix-id")
            .context("Failed to read svix-id header")?
            .ok_or_else(|| anyhow!("Missing svix-id header"))?;

        let svix_timestamp = headers
            .get("svix-timestamp")
            .context("Failed to read svix-timestamp header")?
            .ok_or_else(|| anyhow!("Missing svix-timestamp header"))?;

        let svix_signature = headers
            .get("svix-signature")
            .context("Failed to read svix-signature header")?
            .ok_or_else(|| anyhow!("Missing svix-signature header"))?;

        let timestamp = svix_timestamp
            .parse::<i64>()
            .context("Invalid timestamp format")?;

        let current_time = chrono::Utc::now().timestamp();
        if (current_time - timestamp).abs() > 300 {
            anyhow::bail!("Webhook timestamp too old or in future");
        }

        let signed_content = format!(
            "{}.{}.{}",
            svix_id,
            svix_timestamp,
            String::from_utf8_lossy(body)
        );

        let secret = self
            .signing_secret
            .strip_prefix("whsec_")
            .unwrap_or(&self.signing_secret);

        let secret_bytes = STANDARD
            .decode(secret)
            .map_err(|e| anyhow!("Failed to decode signing secret: {}", e))?;

        let mut mac = Hmac::<Sha256>::new_from_slice(&secret_bytes)
            .map_err(|e| anyhow!("Invalid signing secret: {}", e))?;
        mac.update(signed_content.as_bytes());

        let result = mac.finalize();
        let expected_signature = STANDARD.encode(result.into_bytes());

        let signatures: Vec<&str> = svix_signature
            .split_whitespace()
            .filter_map(|s| s.strip_prefix("v1,"))
            .collect();

        if signatures.is_empty() {
            anyhow::bail!("No valid v1 signatures found");
        }

        let signature_matches = signatures.iter().any(|sig| *sig == expected_signature);

        if !signature_matches {
            anyhow::bail!("Webhook signature verification failed");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verifier_creation() {
        let verifier = ResendWebhookVerifier::create("whsec_test".to_string());
        assert_eq!(verifier.provider_name(), "resend");
    }
}
