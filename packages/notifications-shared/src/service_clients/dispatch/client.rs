use async_trait::async_trait;
use worker::Request;

use crate::service_clients::{
    DispatchResponse,
    dispatch::{
        WebhookInterpretationResponse,
        exceptions::DispatchClientError,
        requests::{DispatchRequest, RedactRequest},
    },
};

#[async_trait(?Send)]
pub trait DispatchClient {
    async fn dispatch(
        &self,
        request: DispatchRequest,
    ) -> Result<DispatchResponse, DispatchClientError>;

    async fn redact(&self, request: RedactRequest) -> Result<bool, DispatchClientError>;

    async fn handle_webhook(
        &self,
        request: Request,
    ) -> Result<WebhookInterpretationResponse, DispatchClientError>;
}
