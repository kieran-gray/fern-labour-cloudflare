use std::collections::HashMap;

use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha2::Sha256;
use uuid::Uuid;

const DEFAULT_TOLERANCE_SECONDS: i64 = 300;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WebhookError {
    MissingTimestamp,
    InvalidTimestamp,
    TimestampOutOfRange { timestamp: i64, now: i64 },
    MissingSignature,
    InvalidSignature,
    PayloadParseError(String),
}

impl std::fmt::Display for WebhookError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::MissingTimestamp => write!(f, "Missing timestamp in signature"),
            Self::InvalidTimestamp => write!(f, "Invalid timestamp format"),
            Self::TimestampOutOfRange { timestamp, now } => {
                write!(
                    f,
                    "Timestamp {} outside tolerance (now: {})",
                    timestamp, now
                )
            }
            Self::MissingSignature => write!(f, "Missing v1 signature"),
            Self::InvalidSignature => write!(f, "Invalid signature"),
            Self::PayloadParseError(msg) => write!(f, "Failed to parse payload: {}", msg),
        }
    }
}

impl std::error::Error for WebhookError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CheckoutCompleted {
    pub session_id: String,
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StripeEvent {
    CheckoutSessionCompleted(CheckoutCompleted),
    CheckoutSessionUnpaid { session_id: String },
    Ignored { event_type: String },
}

pub struct StripeWebhookVerifier {
    secret: String,
    tolerance_seconds: i64,
    clock: Box<dyn Fn() -> i64 + Send + Sync>,
}

impl StripeWebhookVerifier {
    pub fn new(secret: String) -> Self {
        Self {
            secret,
            tolerance_seconds: DEFAULT_TOLERANCE_SECONDS,
            clock: Box::new(|| chrono::Utc::now().timestamp()),
        }
    }

    #[cfg(test)]
    pub fn with_fixed_clock(secret: String, fixed_time: i64) -> Self {
        Self {
            secret,
            tolerance_seconds: DEFAULT_TOLERANCE_SECONDS,
            clock: Box::new(move || fixed_time),
        }
    }

    pub fn verify_and_parse(
        &self,
        payload: &str,
        signature_header: &str,
    ) -> Result<StripeEvent, WebhookError> {
        self.verify_signature(payload, signature_header)?;
        self.parse_event(payload)
    }

    fn verify_signature(&self, payload: &str, signature_header: &str) -> Result<(), WebhookError> {
        let parts = Self::parse_signature_header(signature_header);

        let timestamp_str = parts.get("t").ok_or(WebhookError::MissingTimestamp)?;

        let timestamp = timestamp_str
            .parse::<i64>()
            .map_err(|_| WebhookError::InvalidTimestamp)?;

        let now = (self.clock)();
        if (now - timestamp).abs() > self.tolerance_seconds {
            return Err(WebhookError::TimestampOutOfRange { timestamp, now });
        }

        let expected_sig = parts.get("v1").ok_or(WebhookError::MissingSignature)?;

        let computed_sig = self.compute_signature(timestamp_str, payload);

        if !constant_time_eq(&computed_sig, expected_sig) {
            return Err(WebhookError::InvalidSignature);
        }

        Ok(())
    }

    fn parse_signature_header(header: &str) -> HashMap<&str, &str> {
        header
            .split(',')
            .filter_map(|part| {
                let mut split = part.splitn(2, '=');
                Some((split.next()?, split.next()?))
            })
            .collect()
    }

    fn compute_signature(&self, timestamp: &str, payload: &str) -> String {
        let signed_payload = format!("{}.{}", timestamp, payload);

        let mut mac = Hmac::<Sha256>::new_from_slice(self.secret.as_bytes())
            .expect("HMAC can take key of any size");

        mac.update(signed_payload.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    fn parse_event(&self, payload: &str) -> Result<StripeEvent, WebhookError> {
        let raw: StripeEventRaw = serde_json::from_str(payload)
            .map_err(|e| WebhookError::PayloadParseError(e.to_string()))?;

        if raw.event_type != "checkout.session.completed" {
            return Ok(StripeEvent::Ignored {
                event_type: raw.event_type,
            });
        }

        let session_data: StripeCheckoutSessionData = serde_json::from_value(raw.data)
            .map_err(|e| WebhookError::PayloadParseError(e.to_string()))?;

        let session = session_data.object;

        if session.payment_status != "paid" {
            return Ok(StripeEvent::CheckoutSessionUnpaid {
                session_id: session.id,
            });
        }

        let metadata = session
            .metadata
            .as_ref()
            .ok_or_else(|| WebhookError::PayloadParseError("Missing metadata".into()))?;

        let labour_id = metadata
            .get("labour_id")
            .and_then(|s| Uuid::parse_str(s).ok())
            .ok_or_else(|| WebhookError::PayloadParseError("Invalid labour_id".into()))?;

        let subscription_id = metadata
            .get("subscription_id")
            .and_then(|s| Uuid::parse_str(s).ok())
            .ok_or_else(|| WebhookError::PayloadParseError("Invalid subscription_id".into()))?;

        Ok(StripeEvent::CheckoutSessionCompleted(CheckoutCompleted {
            session_id: session.id,
            labour_id,
            subscription_id,
        }))
    }
}

fn constant_time_eq(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }

    a.bytes()
        .zip(b.bytes())
        .fold(0, |acc, (x, y)| acc | (x ^ y))
        == 0
}

#[derive(Debug, Deserialize)]
struct StripeEventRaw {
    #[serde(rename = "type")]
    event_type: String,
    data: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct StripeCheckoutSessionData {
    object: StripeCheckoutSession,
}

#[derive(Debug, Deserialize)]
struct StripeCheckoutSession {
    id: String,
    metadata: Option<HashMap<String, String>>,
    payment_status: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_SECRET: &str = "whsec_test_secret";
    const TEST_TIMESTAMP: i64 = 1700000000;

    fn create_test_verifier() -> StripeWebhookVerifier {
        StripeWebhookVerifier::with_fixed_clock(TEST_SECRET.to_string(), TEST_TIMESTAMP)
    }

    fn compute_test_signature(payload: &str, timestamp: i64, secret: &str) -> String {
        let signed_payload = format!("{}.{}", timestamp, payload);
        let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(signed_payload.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    fn create_signature_header(timestamp: i64, signature: &str) -> String {
        format!("t={},v1={}", timestamp, signature)
    }

    mod signature_verification {
        use super::*;

        #[test]
        fn valid_signature_is_accepted() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"test"}"#;
            let signature = compute_test_signature(payload, TEST_TIMESTAMP, TEST_SECRET);
            let header = create_signature_header(TEST_TIMESTAMP, &signature);

            let result = verifier.verify_signature(payload, &header);
            assert!(result.is_ok());
        }

        #[test]
        fn invalid_signature_is_rejected() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"test"}"#;
            let header = create_signature_header(TEST_TIMESTAMP, "invalid_signature");

            let result = verifier.verify_signature(payload, &header);
            assert_eq!(result, Err(WebhookError::InvalidSignature));
        }

        #[test]
        fn modified_payload_fails_verification() {
            let verifier = create_test_verifier();
            let original_payload = r#"{"type":"test"}"#;
            let modified_payload = r#"{"type":"modified"}"#;
            let signature = compute_test_signature(original_payload, TEST_TIMESTAMP, TEST_SECRET);
            let header = create_signature_header(TEST_TIMESTAMP, &signature);

            let result = verifier.verify_signature(modified_payload, &header);
            assert_eq!(result, Err(WebhookError::InvalidSignature));
        }

        #[test]
        fn missing_timestamp_is_rejected() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"test"}"#;
            let header = "v1=some_signature";

            let result = verifier.verify_signature(payload, header);
            assert_eq!(result, Err(WebhookError::MissingTimestamp));
        }

        #[test]
        fn invalid_timestamp_format_is_rejected() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"test"}"#;
            let header = "t=not_a_number,v1=some_signature";

            let result = verifier.verify_signature(payload, header);
            assert_eq!(result, Err(WebhookError::InvalidTimestamp));
        }

        #[test]
        fn missing_v1_signature_is_rejected() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"test"}"#;
            let header = format!("t={}", TEST_TIMESTAMP);

            let result = verifier.verify_signature(payload, &header);
            assert_eq!(result, Err(WebhookError::MissingSignature));
        }

        #[test]
        fn timestamp_outside_tolerance_is_rejected() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"test"}"#;
            let old_timestamp = TEST_TIMESTAMP - 400; // Outside 300s tolerance
            let signature = compute_test_signature(payload, old_timestamp, TEST_SECRET);
            let header = create_signature_header(old_timestamp, &signature);

            let result = verifier.verify_signature(payload, &header);
            assert!(matches!(
                result,
                Err(WebhookError::TimestampOutOfRange { .. })
            ));
        }

        #[test]
        fn timestamp_within_tolerance_is_accepted() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"test"}"#;
            let recent_timestamp = TEST_TIMESTAMP - 200; // Within 300s tolerance
            let signature = compute_test_signature(payload, recent_timestamp, TEST_SECRET);
            let header = create_signature_header(recent_timestamp, &signature);

            let result = verifier.verify_signature(payload, &header);
            assert!(result.is_ok());
        }
    }

    mod event_parsing {
        use super::*;

        fn create_checkout_payload(
            payment_status: &str,
            labour_id: &str,
            subscription_id: &str,
        ) -> String {
            serde_json::json!({
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "cs_test_123",
                        "payment_status": payment_status,
                        "metadata": {
                            "labour_id": labour_id,
                            "subscription_id": subscription_id
                        }
                    }
                }
            })
            .to_string()
        }

        #[test]
        fn parses_checkout_session_completed() {
            let verifier = create_test_verifier();
            let labour_id = "550e8400-e29b-41d4-a716-446655440000";
            let subscription_id = "660e8400-e29b-41d4-a716-446655440000";
            let payload = create_checkout_payload("paid", labour_id, subscription_id);

            let result = verifier.parse_event(&payload);

            match result {
                Ok(StripeEvent::CheckoutSessionCompleted(event)) => {
                    assert_eq!(event.session_id, "cs_test_123");
                    assert_eq!(event.labour_id.to_string(), labour_id);
                    assert_eq!(event.subscription_id.to_string(), subscription_id);
                }
                other => panic!("Expected CheckoutSessionCompleted, got {:?}", other),
            }
        }

        #[test]
        fn unpaid_session_returns_unpaid_event() {
            let verifier = create_test_verifier();
            let payload = create_checkout_payload(
                "unpaid",
                "550e8400-e29b-41d4-a716-446655440000",
                "660e8400-e29b-41d4-a716-446655440000",
            );

            let result = verifier.parse_event(&payload);

            match result {
                Ok(StripeEvent::CheckoutSessionUnpaid { session_id }) => {
                    assert_eq!(session_id, "cs_test_123");
                }
                other => panic!("Expected CheckoutSessionUnpaid, got {:?}", other),
            }
        }

        #[test]
        fn other_event_types_are_ignored() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"payment_intent.succeeded","data":{"object":{}}}"#;

            let result = verifier.parse_event(payload);

            match result {
                Ok(StripeEvent::Ignored { event_type }) => {
                    assert_eq!(event_type, "payment_intent.succeeded");
                }
                other => panic!("Expected Ignored, got {:?}", other),
            }
        }

        #[test]
        fn missing_metadata_returns_error() {
            let verifier = create_test_verifier();
            let payload = serde_json::json!({
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "cs_test_123",
                        "payment_status": "paid"
                    }
                }
            })
            .to_string();

            let result = verifier.parse_event(&payload);
            assert!(matches!(result, Err(WebhookError::PayloadParseError(_))));
        }

        #[test]
        fn invalid_labour_id_returns_error() {
            let verifier = create_test_verifier();
            let payload = create_checkout_payload(
                "paid",
                "not-a-uuid",
                "660e8400-e29b-41d4-a716-446655440000",
            );

            let result = verifier.parse_event(&payload);
            assert!(matches!(result, Err(WebhookError::PayloadParseError(_))));
        }

        #[test]
        fn invalid_subscription_id_returns_error() {
            let verifier = create_test_verifier();
            let payload = create_checkout_payload(
                "paid",
                "550e8400-e29b-41d4-a716-446655440000",
                "not-a-uuid",
            );

            let result = verifier.parse_event(&payload);
            assert!(matches!(result, Err(WebhookError::PayloadParseError(_))));
        }

        #[test]
        fn invalid_json_returns_error() {
            let verifier = create_test_verifier();
            let payload = "not valid json";

            let result = verifier.parse_event(payload);
            assert!(matches!(result, Err(WebhookError::PayloadParseError(_))));
        }
    }

    mod verify_and_parse {
        use super::*;

        #[test]
        fn full_flow_works() {
            let verifier = create_test_verifier();
            let labour_id = "550e8400-e29b-41d4-a716-446655440000";
            let subscription_id = "660e8400-e29b-41d4-a716-446655440000";
            let payload = serde_json::json!({
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "cs_test_123",
                        "payment_status": "paid",
                        "metadata": {
                            "labour_id": labour_id,
                            "subscription_id": subscription_id
                        }
                    }
                }
            })
            .to_string();

            let signature = compute_test_signature(&payload, TEST_TIMESTAMP, TEST_SECRET);
            let header = create_signature_header(TEST_TIMESTAMP, &signature);

            let result = verifier.verify_and_parse(&payload, &header);

            match result {
                Ok(StripeEvent::CheckoutSessionCompleted(event)) => {
                    assert_eq!(event.session_id, "cs_test_123");
                    assert_eq!(event.labour_id.to_string(), labour_id);
                    assert_eq!(event.subscription_id.to_string(), subscription_id);
                }
                other => panic!("Expected CheckoutSessionCompleted, got {:?}", other),
            }
        }

        #[test]
        fn invalid_signature_short_circuits() {
            let verifier = create_test_verifier();
            let payload = r#"{"type":"checkout.session.completed"}"#;
            let header = create_signature_header(TEST_TIMESTAMP, "invalid");

            let result = verifier.verify_and_parse(payload, &header);
            assert_eq!(result, Err(WebhookError::InvalidSignature));
        }
    }

    mod constant_time_comparison {
        use super::*;

        #[test]
        fn equal_strings_return_true() {
            assert!(constant_time_eq("hello", "hello"));
        }

        #[test]
        fn different_strings_return_false() {
            assert!(!constant_time_eq("hello", "world"));
        }

        #[test]
        fn different_lengths_return_false() {
            assert!(!constant_time_eq("short", "longer"));
        }

        #[test]
        fn empty_strings_return_true() {
            assert!(constant_time_eq("", ""));
        }
    }
}
