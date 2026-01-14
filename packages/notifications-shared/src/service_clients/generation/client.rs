use async_trait::async_trait;
use uuid::Uuid;

use crate::{
    service_clients::generation::exceptions::GenerationClientError,
    value_objects::{NotificationChannel, NotificationTemplateData, RenderedContent},
};

#[async_trait(?Send)]
pub trait GenerationClient {
    async fn render(
        &self,
        notification_id: Uuid,
        channel: NotificationChannel,
        template_data: NotificationTemplateData,
    ) -> Result<RenderedContent, GenerationClientError>;
}
