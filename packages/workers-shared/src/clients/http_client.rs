use async_trait::async_trait;
use serde_json::Value;
use tracing::error;
use worker::{Fetch, Headers, Method, Request, RequestInit};

#[async_trait(?Send)]
pub trait HttpClientTrait: Send + Sync {
    async fn post(
        &self,
        url: &str,
        body: Value,
        headers: Vec<(&str, &str)>,
    ) -> Result<Value, String>;
}

pub struct WorkerHttpClient;

impl WorkerHttpClient {
    pub fn new() -> Self {
        Self
    }
}

impl Default for WorkerHttpClient {
    fn default() -> Self {
        WorkerHttpClient::new()
    }
}

#[async_trait(?Send)]
impl HttpClientTrait for WorkerHttpClient {
    async fn post(
        &self,
        url: &str,
        body: Value,
        headers: Vec<(&str, &str)>,
    ) -> Result<Value, String> {
        let body_string = serde_json::to_string(&body)
            .map_err(|e| format!("Failed to serialize request body: {}", e))?;

        let mut init = RequestInit::new();
        init.with_method(Method::Post);
        init.with_body(Some(body_string.into()));

        let worker_headers = Headers::new();
        for (name, value) in headers {
            worker_headers
                .set(name, value)
                .map_err(|e| format!("Failed to set header {}: {}", name, e))?;
        }
        init.with_headers(worker_headers);

        let request = Request::new_with_init(url, &init)
            .map_err(|e| format!("Failed to create request: {}", e))?;

        let mut response = Fetch::Request(request).send().await.map_err(|e| {
            error!("HTTP request failed: {:?}", e);
            format!("HTTP request failed: {}", e)
        })?;

        let json_response: Value = response.json().await.map_err(|e| {
            error!("Failed to parse JSON response: {:?}", e);
            format!("Failed to parse JSON response: {}", e)
        })?;

        Ok(json_response)
    }
}
