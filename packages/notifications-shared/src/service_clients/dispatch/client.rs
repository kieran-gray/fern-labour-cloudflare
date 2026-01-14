use async_trait::async_trait;

use crate::service_clients::dispatch::{
    exceptions::DispatchClientError, requests::DispatchRequest,
};

#[async_trait(?Send)]
pub trait DispatchClient {
    async fn dispatch(
        &self,
        request: DispatchRequest,
    ) -> Result<Option<String>, DispatchClientError>;
}
