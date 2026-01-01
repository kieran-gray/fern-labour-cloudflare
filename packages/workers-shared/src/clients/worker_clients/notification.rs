use std::collections::HashMap;

use async_trait::async_trait;
use fern_labour_notifications_shared::service_clients::notification::{
    NotificationClient, NotificationClientError, NotificationRequest,
};
use fern_labour_notifications_shared::value_objects::{
    NotificationChannel, NotificationPriority, NotificationTemplateData,
};
use tracing::error;

use crate::clients::request_utils::{
    StatusCodeCategory, build_json_post_request, internal_auth_headers,
};

pub struct FetcherNotificationClient {
    fetcher: worker::Fetcher,
    auth_token: String,
}

impl FetcherNotificationClient {
    pub fn create(fetcher: worker::Fetcher, auth_token: String) -> Self {
        Self {
            fetcher,
            auth_token,
        }
    }
}

#[async_trait(?Send)]
impl NotificationClient for FetcherNotificationClient {
    async fn request_notification(
        &self,
        channel: NotificationChannel,
        destination: String,
        template_data: NotificationTemplateData,
        metadata: Option<HashMap<String, String>>,
        priority: NotificationPriority,
    ) -> Result<(), NotificationClientError> {
        let request = NotificationRequest {
            channel: channel.to_string(),
            destination,
            template_data,
            metadata,
            priority,
        };

        let (init, _) = build_json_post_request(
            &request,
            internal_auth_headers("notification-service", &self.auth_token),
        )
        .map_err(NotificationClientError::SerializationError)?;

        let response = self
            .fetcher
            .fetch("https://fernlabour.com/api/v1/notification", Some(init))
            .await
            .map_err(|e| {
                error!(error = ?e, "Notification service request failed");
                NotificationClientError::RequestFailed(format!("Request failed: {e}"))
            })?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => Ok(()),
            StatusCodeCategory::ClientError => Err(NotificationClientError::RequestFailed(
                format!("Client error: {status}"),
            )),
            StatusCodeCategory::ServerError => Err(NotificationClientError::InternalError(
                format!("Server error: {status}"),
            )),
            StatusCodeCategory::Unknown => Err(NotificationClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }
}
