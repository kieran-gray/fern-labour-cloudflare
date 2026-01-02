use async_trait::async_trait;
use fern_labour_notifications_shared::service_clients::{
    GenerationClient, GenerationClientError, RenderRequest, RenderResponse,
};
use fern_labour_notifications_shared::value_objects::{
    NotificationChannel, NotificationTemplateData, RenderedContent,
};
use tracing::{debug, error};
use uuid::Uuid;
use worker::Response;

use crate::clients::request_utils::{
    StatusCodeCategory, build_json_post_request, internal_auth_headers,
};

pub struct FetcherGenerationClient {
    fetcher: worker::Fetcher,
    auth_token: String,
}

impl FetcherGenerationClient {
    pub fn create(fetcher: worker::Fetcher, auth_token: String) -> Self {
        Self {
            fetcher,
            auth_token,
        }
    }

    async fn do_render(
        &self,
        notification_id: Uuid,
        channel: NotificationChannel,
        template_data: NotificationTemplateData,
        url: &str,
    ) -> Result<Response, GenerationClientError> {
        let request = RenderRequest {
            notification_id,
            channel,
            template_data,
        };

        let (init, _) = build_json_post_request(
            &request,
            internal_auth_headers("notification-service", &self.auth_token),
        )
        .map_err(GenerationClientError::SerializationError)?;

        self.fetcher.fetch(url, Some(init)).await.map_err(|e| {
            error!(error = ?e, "Generation service request failed");
            GenerationClientError::RequestFailed(format!("Request failed: {e}"))
        })
    }
}

#[async_trait(?Send)]
impl GenerationClient for FetcherGenerationClient {
    async fn render_async(
        &self,
        notification_id: Uuid,
        channel: NotificationChannel,
        template_data: NotificationTemplateData,
    ) -> Result<Response, GenerationClientError> {
        self.do_render(
            notification_id,
            channel,
            template_data,
            "https://fernlabour.com/api/v1/render-async",
        )
        .await
    }

    async fn render(
        &self,
        notification_id: Uuid,
        channel: NotificationChannel,
        template_data: NotificationTemplateData,
    ) -> Result<RenderedContent, GenerationClientError> {
        let mut response = self
            .do_render(
                notification_id,
                channel,
                template_data,
                "https://fernlabour.com/api/v1/render",
            )
            .await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                debug!("Template rendered successfully");
                let render_response: RenderResponse = response.json().await.map_err(|e| {
                    GenerationClientError::InternalError(format!("Failed to parse response: {e}"))
                })?;
                Ok(render_response.rendered_content)
            }
            StatusCodeCategory::ClientError => Err(GenerationClientError::RequestFailed(format!(
                "Client error: {status}"
            ))),
            StatusCodeCategory::ServerError => Err(GenerationClientError::InternalError(format!(
                "Server error: {status}"
            ))),
            StatusCodeCategory::Unknown => Err(GenerationClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }
}
