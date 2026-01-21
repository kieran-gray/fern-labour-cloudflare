use std::sync::Arc;

use async_trait::async_trait;
use fern_labour_workers_shared::clients::HttpClientTrait;
use serde::Deserialize;
use tracing::{error, info};

use crate::application::{exceptions::AppError, services::alert_service::AlertServiceTrait};

#[derive(Deserialize, Debug)]
struct SlackResponse {
    ok: bool,
    error: Option<String>,
}

pub struct SlackAlertService {
    token: String,
    channel: String,
    url: String,
    http_client: Arc<dyn HttpClientTrait>,
}

impl SlackAlertService {
    pub fn create(
        token: &str,
        channel: &str,
        url: &str,
        http_client: Arc<dyn HttpClientTrait>,
    ) -> Arc<SlackAlertService> {
        Arc::new(Self {
            token: token.to_string(),
            channel: channel.to_string(),
            url: url.to_string(),
            http_client,
        })
    }
}

#[async_trait(?Send)]
impl AlertServiceTrait for SlackAlertService {
    async fn send_alert(&self, message: String) -> Result<(), AppError> {
        let body = serde_json::json!({
            "channel": &self.channel,
            "text": message,
        });

        let response_json = self
            .http_client
            .post(
                &self.url,
                body,
                vec![
                    ("Content-Type", "application/json"),
                    ("Authorization", &format!("Bearer {}", self.token)),
                ],
            )
            .await
            .map_err(|e| {
                error!("Slack HTTP request failed: {e}");
                AppError::InternalError(e)
            })?;

        let slack_response: SlackResponse = serde_json::from_value(response_json).map_err(|e| {
            error!("Failed to parse slack response: {:?}", e);
            AppError::InternalError(e.to_string())
        })?;

        if slack_response.ok {
            info!("Contact message successfully published to slack");
            Ok(())
        } else {
            let message = match slack_response.error {
                Some(error) => error,
                _ => "Unknown error in slack response".into(),
            };
            error!("Slack error: {message}");
            Err(AppError::InternalError(message))
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

        fn get_captured_headers(&self) -> Option<Vec<(String, String)>> {
            self.captured_headers.lock().unwrap().clone()
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
    async fn test_send_alert_success() {
        let mock_response = json!({
            "ok": true
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = SlackAlertService::create(
            "test-token",
            "test-channel",
            "https://slack.test.com",
            mock_client.clone(),
        );

        let result = service.send_alert("Test message".to_string()).await;

        assert!(result.is_ok());

        assert_eq!(
            mock_client.get_captured_url().unwrap(),
            "https://slack.test.com"
        );

        let body = mock_client.get_captured_body().unwrap();
        assert_eq!(body["channel"], "test-channel");
        assert_eq!(body["text"], "Test message");

        let headers = mock_client.get_captured_headers().unwrap();
        assert!(headers.contains(&("Content-Type".to_string(), "application/json".to_string())));
        assert!(headers.contains(&("Authorization".to_string(), "Bearer test-token".to_string())));
    }

    #[tokio::test]
    async fn test_send_alert_slack_error() {
        let mock_response = json!({
            "ok": false,
            "error": "channel_not_found"
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = SlackAlertService::create(
            "test-token",
            "invalid-channel",
            "https://slack.test.com",
            mock_client,
        );

        let result = service.send_alert("Test message".to_string()).await;

        assert!(result.is_err());
        match result {
            Err(AppError::InternalError(msg)) => {
                assert_eq!(msg, "channel_not_found");
            }
            _ => panic!("Expected InternalError"),
        }
    }

    #[tokio::test]
    async fn test_send_alert_slack_error_without_message() {
        let mock_response = json!({
            "ok": false
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = SlackAlertService::create(
            "test-token",
            "test-channel",
            "https://slack.test.com",
            mock_client,
        );

        let result = service.send_alert("Test message".to_string()).await;

        assert!(result.is_err());
        match result {
            Err(AppError::InternalError(msg)) => {
                assert_eq!(msg, "Unknown error in slack response");
            }
            _ => panic!("Expected InternalError"),
        }
    }

    #[tokio::test]
    async fn test_send_alert_http_error() {
        let mock_client = MockHttpClient::new(Err("Network error".to_string()));
        let service = SlackAlertService::create(
            "test-token",
            "test-channel",
            "https://slack.test.com",
            mock_client,
        );

        let result = service.send_alert("Test message".to_string()).await;

        assert!(result.is_err());
        match result {
            Err(AppError::InternalError(msg)) => {
                assert_eq!(msg, "Network error");
            }
            _ => panic!("Expected InternalError for HTTP error"),
        }
    }

    #[tokio::test]
    async fn test_send_alert_malformed_response() {
        let mock_response = json!({
            "unexpected_field": "value"
        });
        let mock_client = MockHttpClient::new(Ok(mock_response));
        let service = SlackAlertService::create(
            "test-token",
            "test-channel",
            "https://slack.test.com",
            mock_client,
        );

        let result = service.send_alert("Test message".to_string()).await;

        assert!(result.is_err());
        match result {
            Err(AppError::InternalError(_)) => {}
            _ => panic!("Expected InternalError for malformed response"),
        }
    }
}
