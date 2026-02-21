use async_trait::async_trait;
use fern_labour_notifications_shared::service_clients::{
    DispatchClient, DispatchClientError, DispatchRequest, DispatchResponse,
    dispatch::{
        WebhookInterpretationResponse,
        requests::{RedactRequest, ScheduleRequest},
        responses::{RedactResponse, ScheduleResponse},
    },
};
use serde::Serialize;
use tracing::{debug, error};
use worker::{Request, Response};

use crate::clients::request_utils::{
    StatusCodeCategory, build_json_post_request, internal_auth_headers,
};

pub struct FetcherDispatchClient {
    fetcher: worker::Fetcher,
    auth_token: String,
}

impl FetcherDispatchClient {
    pub fn create(fetcher: worker::Fetcher, auth_token: String) -> Self {
        Self {
            fetcher,
            auth_token,
        }
    }

    async fn post(
        &self,
        request: impl Serialize,
        url: &str,
    ) -> Result<Response, DispatchClientError> {
        let (init, _) = build_json_post_request(
            &request,
            internal_auth_headers("notification-service", &self.auth_token),
        )
        .map_err(DispatchClientError::SerializationError)?;

        self.fetcher.fetch(url, Some(init)).await.map_err(|e| {
            error!(error = ?e, "Dispatch service request failed");
            DispatchClientError::RequestFailed(format!("Request failed: {e}"))
        })
    }
}

#[async_trait(?Send)]
impl DispatchClient for FetcherDispatchClient {
    async fn schedule(
        &self,
        request: ScheduleRequest,
    ) -> Result<ScheduleResponse, DispatchClientError> {
        let mut response = self
            .post(request, "https://fernlabour.com/api/v1/schedule")
            .await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                debug!("Notification scheduled successfully");
                let schedule_response: ScheduleResponse = response.json().await.map_err(|e| {
                    DispatchClientError::InternalError(format!("Failed to parse response: {e}"))
                })?;
                Ok(schedule_response)
            }
            StatusCodeCategory::ClientError => Err(DispatchClientError::RequestFailed(format!(
                "Client error: {status}"
            ))),
            StatusCodeCategory::ServerError => Err(DispatchClientError::InternalError(format!(
                "Server error: {status}"
            ))),
            StatusCodeCategory::Unknown => Err(DispatchClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }

    async fn dispatch(
        &self,
        request: DispatchRequest,
    ) -> Result<DispatchResponse, DispatchClientError> {
        let mut response = self
            .post(request, "https://fernlabour.com/api/v1/dispatch")
            .await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                debug!("Notification dispatched successfully");
                let dispatch_response: DispatchResponse = response.json().await.map_err(|e| {
                    DispatchClientError::InternalError(format!("Failed to parse response: {e}"))
                })?;
                Ok(dispatch_response)
            }
            StatusCodeCategory::ClientError => Err(DispatchClientError::RequestFailed(format!(
                "Client error: {status}"
            ))),
            StatusCodeCategory::ServerError => Err(DispatchClientError::InternalError(format!(
                "Server error: {status}"
            ))),
            StatusCodeCategory::Unknown => Err(DispatchClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }

    async fn redact(&self, request: RedactRequest) -> Result<bool, DispatchClientError> {
        let mut response = self
            .post(request, "https://fernlabour.com/api/v1/redact")
            .await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                debug!("Notification redacted successfully");
                let dispatch_response: RedactResponse = response.json().await.map_err(|e| {
                    DispatchClientError::InternalError(format!("Failed to parse response: {e}"))
                })?;
                Ok(dispatch_response.redacted)
            }
            StatusCodeCategory::ClientError => Err(DispatchClientError::RequestFailed(format!(
                "Client error: {status}"
            ))),
            StatusCodeCategory::ServerError => Err(DispatchClientError::InternalError(format!(
                "Server error: {status}"
            ))),
            StatusCodeCategory::Unknown => Err(DispatchClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }

    async fn handle_webhook(
        &self,
        request: Request,
    ) -> Result<WebhookInterpretationResponse, DispatchClientError> {
        let mut response = self
            .fetcher
            .fetch_request(request)
            .await
            .map_err(|e| DispatchClientError::RequestFailed(format!("Request failed: {e}")))?;
        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                let webhook_interpretation: WebhookInterpretationResponse =
                    response.json().await.map_err(|e| {
                        DispatchClientError::InternalError(format!("Failed to parse response: {e}"))
                    })?;
                Ok(webhook_interpretation)
            }
            StatusCodeCategory::ClientError => Err(DispatchClientError::RequestFailed(format!(
                "Client error: {status}"
            ))),
            StatusCodeCategory::ServerError => Err(DispatchClientError::InternalError(format!(
                "Server error: {status}"
            ))),
            StatusCodeCategory::Unknown => Err(DispatchClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }
}
