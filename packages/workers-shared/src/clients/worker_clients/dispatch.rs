use async_trait::async_trait;
use fern_labour_notifications_shared::service_clients::{
    DispatchClient, DispatchClientError, DispatchRequest, DispatchResponse,
};
use tracing::{debug, error};
use worker::Response;

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

    async fn do_dispatch(
        &self,
        request: DispatchRequest,
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
    async fn dispatch_async(
        &self,
        request: DispatchRequest,
    ) -> Result<Response, DispatchClientError> {
        self.do_dispatch(request, "https://fernlabour.com/api/v1/dispatch-async")
            .await
    }

    async fn dispatch(
        &self,
        request: DispatchRequest,
    ) -> Result<Option<String>, DispatchClientError> {
        let mut response = self
            .do_dispatch(request, "https://fernlabour.com/api/v1/dispatch")
            .await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                debug!("Notification dispatched successfully");
                let dispatch_response: DispatchResponse = response.json().await.map_err(|e| {
                    DispatchClientError::InternalError(format!("Failed to parse response: {e}"))
                })?;
                Ok(dispatch_response.external_id)
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
