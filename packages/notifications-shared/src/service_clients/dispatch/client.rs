use async_trait::async_trait;
use worker::Request;

use crate::service_clients::dispatch::{
    WebhookInterpretationResponse, exceptions::DispatchClientError, requests::DispatchRequest,
};

#[async_trait(?Send)]
pub trait DispatchClient {
    async fn dispatch(
        &self,
        request: DispatchRequest,
    ) -> Result<Option<String>, DispatchClientError>;

    async fn handle_webhook(
        &self,
        request: Request,
    ) -> Result<WebhookInterpretationResponse, DispatchClientError>;
}
