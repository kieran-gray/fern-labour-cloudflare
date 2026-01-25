use anyhow::Result;
use async_trait::async_trait;
use fern_labour_notifications_shared::{
    service_clients::DispatchResponse, value_objects::NotificationChannel,
};

use super::context::DispatchContext;

pub enum DispatchResult {
    Tracked {
        external_id: String,
        provider: String,
    },
    Untracked {
        provider: String,
    },
}

impl From<DispatchResult> for DispatchResponse {
    fn from(value: DispatchResult) -> Self {
        match value {
            DispatchResult::Tracked {
                external_id,
                provider,
            } => Self {
                external_id: Some(external_id),
                provider,
            },
            DispatchResult::Untracked { provider } => Self {
                external_id: None,
                provider,
            },
        }
    }
}

#[async_trait(?Send)]
pub trait NotificationGatewayTrait: Send + Sync {
    fn channel(&self) -> NotificationChannel;

    fn provider(&self) -> &str;

    async fn dispatch(&self, context: &DispatchContext) -> Result<DispatchResult>;

    async fn redact(&self, external_id: String) -> Result<bool>;
}
