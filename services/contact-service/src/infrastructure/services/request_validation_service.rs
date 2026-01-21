use std::sync::Arc;

use crate::application::{
    exceptions::AppError, services::request_validation::RequestValidationServiceTrait,
};
use async_trait::async_trait;
use fern_labour_workers_shared::clients::HttpClientTrait;

use serde::Deserialize;
use tracing::{debug, error, info};

#[derive(Deserialize, Debug)]
struct TurnstileResponse {
    success: bool,
    #[serde(rename = "error-codes")]
    error_codes: Option<Vec<String>>,
}

pub struct CloudflareRequestValidationService {
    siteverify_url: String,
    secret_key: String,
    http_client: Arc<dyn HttpClientTrait>,
}

impl CloudflareRequestValidationService {
    pub fn create(
        siteverify_url: &str,
        secret_key: &str,
        http_client: Arc<dyn HttpClientTrait>,
    ) -> Arc<dyn RequestValidationServiceTrait> {
        Arc::new(Self {
            siteverify_url: siteverify_url.to_string(),
            secret_key: secret_key.to_string(),
            http_client,
        })
    }
}

#[async_trait(?Send)]
impl RequestValidationServiceTrait for CloudflareRequestValidationService {
    async fn verify(&self, token: String, ip: String) -> Result<(), AppError> {
        let body = serde_json::json!({
            "secret": &self.secret_key,
            "response": token,
            "remoteip": ip,
        });

        let response_json = self
            .http_client
            .post(
                &self.siteverify_url,
                body,
                vec![("Content-Type", "application/json")],
            )
            .await
            .map_err(|e| {
                error!("Turnstile HTTP request failed: {}", e);
                AppError::InternalError(e)
            })?;

        let turnstile_response: TurnstileResponse =
            serde_json::from_value(response_json).map_err(|e| {
                error!("Failed to parse Turnstile response: {:?}", e);
                AppError::InternalError(e.to_string())
            })?;

        debug!("Turnstile response: {:?}", turnstile_response);

        if turnstile_response.success {
            Ok(())
        } else {
            if let Some(error_codes) = &turnstile_response.error_codes {
                info!("Turnstile validation failed with errors: {:?}", error_codes);

                for error_code in error_codes {
                    match error_code.as_str() {
                        "invalid-input-secret" => {
                            error!("Invalid secret key configured");
                            return Err(AppError::InternalError(
                                "Invalid secret key configured".into(),
                            ));
                        }
                        "invalid-input-response" => {
                            info!("Invalid or expired token");
                        }
                        "timeout-or-duplicate" => {
                            info!("Token timeout or duplicate submission");
                        }
                        _ => {
                            info!("Unknown error code: {}", error_code);
                        }
                    }
                }
            }

            Err(AppError::Unauthorised(
                "Turnstile validation failed".to_string(),
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{Value, json};
    use std::sync::Mutex;

    struct MockHttpClient {
        response: Mutex<Option<Result<Value, String>>>,
        captured_url: Mutex<Option<String>>,
        captured_body: Mutex<Option<Value>>,
        captured_headers: Mutex<Option<Vec<(String, String)>>>,
    }

    impl MockHttpClient {
        fn new(response: Result<Value, String>) -> Arc<Self> {
            Arc::new(Self {
                response: Mutex::new(Some(response)),
                captured_url: Mutex::new(None),
                captured_body: Mutex::new(None),
                captured_headers: Mutex::new(None),
            })
        }

        fn get_captured_url(&self) -> Option<String> {
            self.captured_url.lock().unwrap().clone()
        }

        fn get_captured_body(&self) -> Option<Value> {
            self.captured_body.lock().unwrap().clone()
        }
    }

    #[async_trait(?Send)]
    impl HttpClientTrait for MockHttpClient {
        async fn post(
            &self,
            url: &str,
            body: Value,
            headers: Vec<(&str, &str)>,
        ) -> Result<Value, String> {
            *self.captured_url.lock().unwrap() = Some(url.to_string());
            *self.captured_body.lock().unwrap() = Some(body.clone());
            *self.captured_headers.lock().unwrap() = Some(
                headers
                    .into_iter()
                    .map(|(k, v)| (k.to_string(), v.to_string()))
                    .collect(),
            );

            self.response
                .lock()
                .unwrap()
                .take()
                .expect("Response already consumed")
        }
    }

    #[tokio::test]
    async fn test_verify_success() {
        let mock_response = json!({
            "success": true,
            "error-codes": []
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = CloudflareRequestValidationService::create(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "test-secret-key",
            mock_client.clone(),
        );

        let result = service
            .verify("test-token".to_string(), "127.0.0.1".to_string())
            .await;

        assert!(result.is_ok());

        assert_eq!(
            mock_client.get_captured_url().unwrap(),
            "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        );

        let body = mock_client.get_captured_body().unwrap();
        assert_eq!(body["secret"], "test-secret-key");
        assert_eq!(body["response"], "test-token");
        assert_eq!(body["remoteip"], "127.0.0.1");
    }

    #[tokio::test]
    async fn test_verify_invalid_token() {
        let mock_response = json!({
            "success": false,
            "error-codes": ["invalid-input-response"]
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = CloudflareRequestValidationService::create(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "test-secret-key",
            mock_client,
        );

        let result = service
            .verify("invalid-token".to_string(), "127.0.0.1".to_string())
            .await;

        assert!(result.is_err());
        match result {
            Err(AppError::Unauthorised(msg)) => {
                assert_eq!(msg, "Turnstile validation failed");
            }
            _ => panic!("Expected Unauthorised error"),
        }
    }

    #[tokio::test]
    async fn test_verify_timeout_or_duplicate() {
        let mock_response = json!({
            "success": false,
            "error-codes": ["timeout-or-duplicate"]
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = CloudflareRequestValidationService::create(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "test-secret-key",
            mock_client,
        );

        let result = service
            .verify("duplicate-token".to_string(), "127.0.0.1".to_string())
            .await;

        assert!(result.is_err());
        match result {
            Err(AppError::Unauthorised(msg)) => {
                assert_eq!(msg, "Turnstile validation failed");
            }
            _ => panic!("Expected Unauthorised error"),
        }
    }

    #[tokio::test]
    async fn test_verify_invalid_secret_key() {
        let mock_response = json!({
            "success": false,
            "error-codes": ["invalid-input-secret"]
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = CloudflareRequestValidationService::create(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "wrong-secret-key",
            mock_client,
        );

        let result = service
            .verify("test-token".to_string(), "127.0.0.1".to_string())
            .await;

        assert!(result.is_err());
        match result {
            Err(AppError::InternalError(msg)) => {
                assert_eq!(msg, "Invalid secret key configured");
            }
            _ => panic!("Expected InternalError for invalid secret key"),
        }
    }

    #[tokio::test]
    async fn test_verify_multiple_error_codes() {
        let mock_response = json!({
            "success": false,
            "error-codes": ["invalid-input-response", "timeout-or-duplicate"]
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = CloudflareRequestValidationService::create(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "test-secret-key",
            mock_client,
        );

        let result = service
            .verify("test-token".to_string(), "127.0.0.1".to_string())
            .await;

        assert!(result.is_err());
        match result {
            Err(AppError::Unauthorised(_)) => {}
            _ => panic!("Expected Unauthorised error"),
        }
    }

    #[tokio::test]
    async fn test_verify_http_error() {
        let mock_client = MockHttpClient::new(Err("Network error".to_string()));
        let service = CloudflareRequestValidationService::create(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "test-secret-key",
            mock_client,
        );

        let result = service
            .verify("test-token".to_string(), "127.0.0.1".to_string())
            .await;

        assert!(result.is_err());
        match result {
            Err(AppError::InternalError(msg)) => {
                assert_eq!(msg, "Network error");
            }
            _ => panic!("Expected InternalError for HTTP error"),
        }
    }

    #[tokio::test]
    async fn test_verify_malformed_response() {
        let mock_response = json!({
            "unexpected_field": "value"
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = CloudflareRequestValidationService::create(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "test-secret-key",
            mock_client,
        );

        let result = service
            .verify("test-token".to_string(), "127.0.0.1".to_string())
            .await;

        assert!(result.is_err());
        match result {
            Err(AppError::InternalError(_)) => {}
            _ => panic!("Expected InternalError for malformed response"),
        }
    }
}
