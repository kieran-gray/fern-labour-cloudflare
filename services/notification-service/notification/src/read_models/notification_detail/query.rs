use anyhow::Result;
use async_trait::async_trait;
use fern_labour_event_sourcing_rs::DecodedCursor;
use uuid::Uuid;

use crate::read_models::notification_detail::{
    read_model::NotificationDetail, repository::NotificationDetailRepositoryTrait,
};

#[async_trait(?Send)]
pub trait NotificationDetailQueryHandler {
    async fn get_notifications(
        &self,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<NotificationDetail>>;

    async fn get_notification(&self, notification_id: &Uuid) -> Result<NotificationDetail>;
    async fn get_by_external_id(&self, external_id: String) -> Result<NotificationDetail>;
}

pub struct NotificationDetailQuery {
    repository: Box<dyn NotificationDetailRepositoryTrait>,
}

impl NotificationDetailQuery {
    pub fn create(repository: Box<dyn NotificationDetailRepositoryTrait>) -> Self {
        Self { repository }
    }
}

#[async_trait(?Send)]
impl NotificationDetailQueryHandler for NotificationDetailQuery {
    async fn get_notifications(
        &self,
        limit: usize,
        cursor: Option<DecodedCursor>,
    ) -> Result<Vec<NotificationDetail>> {
        let notifications = self.repository.get(limit, cursor).await?;

        Ok(notifications)
    }

    async fn get_notification(&self, notification_id: &Uuid) -> Result<NotificationDetail> {
        let notification = self.repository.get_by_id(*notification_id).await?;

        Ok(notification)
    }

    async fn get_by_external_id(&self, external_id: String) -> Result<NotificationDetail> {
        let notification = self.repository.get_by_external_id(external_id).await?;

        Ok(notification)
    }
}
