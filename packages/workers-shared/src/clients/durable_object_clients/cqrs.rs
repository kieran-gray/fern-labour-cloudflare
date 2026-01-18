use serde::Serialize;
use tracing::error;
use uuid::Uuid;
use worker::{Headers, Method, ObjectNamespace, Request, RequestInit, Response, Stub};

use crate::clients::worker_clients::auth::User;

const DURABLE_OBJECT_BASE_URL: &str = "https://durable.fernlabour.com";

type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    StubError(String),
    SerializationError(String),
    RequestError(String),
    DurableObjectError(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::StubError(msg) => write!(f, "Failed to get DO stub: {msg}"),
            Self::SerializationError(msg) => write!(f, "Serialization error: {msg}"),
            Self::RequestError(msg) => write!(f, "Request error: {msg}"),
            Self::DurableObjectError(msg) => write!(f, "Durable Object error: {msg}"),
        }
    }
}

impl std::error::Error for Error {}

pub struct DurableObjectCQRSClient {
    namespace: ObjectNamespace,
}

impl DurableObjectCQRSClient {
    pub fn create(namespace: ObjectNamespace) -> Self {
        Self { namespace }
    }

    pub async fn send_command<C: Serialize>(
        &self,
        aggregate_id: Uuid,
        command: C,
        user: &User,
        url: &str,
    ) -> Result<Response> {
        let body = self.serialize(&command)?;

        let headers = self.create_headers_with_user(user)?;

        self.send_request(aggregate_id, url, Method::Post, headers, Some(body))
            .await
    }

    pub async fn websocket_command(
        &self,
        aggregate_id: Uuid,
        user: &User,
        url: &str,
    ) -> Result<Response> {
        let headers = self.create_headers_with_user(user)?;
        headers
            .append("Upgrade", "websocket")
            .map_err(|e| Error::RequestError(format!("Failed to set Upgrade header: {e}")))?;

        self.send_request(aggregate_id, url, Method::Get, headers, None)
            .await
    }

    pub async fn send_query(&self, aggregate_id: Uuid, url: &str, user: &User) -> Result<Response> {
        let headers = self.create_headers_with_user(user)?;

        self.send_request(aggregate_id, url, Method::Get, headers, None)
            .await
    }

    pub async fn send_query_with_body<Q: Serialize>(
        &self,
        aggregate_id: Uuid,
        query: Q,
        user: &User,
        url: &str,
    ) -> Result<Response> {
        let body = self.serialize(&query)?;
        let headers = self.create_headers_with_user(user)?;

        self.send_request(aggregate_id, url, Method::Post, headers, Some(body))
            .await
    }

    fn serialize<T: Serialize>(&self, value: &T) -> Result<String> {
        serde_json::to_string(value).map_err(|e| {
            error!(error = ?e, "Failed to serialize value");
            Error::SerializationError(format!("Failed to serialize: {e}"))
        })
    }

    fn create_headers_with_user(&self, user: &User) -> Result<Headers> {
        let headers = Headers::new();

        let user_json = serde_json::to_string(user)
            .map_err(|e| Error::SerializationError(format!("Failed to serialize user: {e}")))?;

        headers
            .set("X-User-Info", &user_json)
            .map_err(|e| Error::RequestError(format!("Failed to set X-User-Info header: {e}")))?;

        headers
            .set("Content-Type", "application/json")
            .map_err(|e| Error::RequestError(format!("Failed to set Content-Type header: {e}")))?;

        Ok(headers)
    }

    fn get_stub(&self, aggregate_id: Uuid) -> Result<Stub> {
        self.namespace
            .get_by_name(&aggregate_id.to_string())
            .map_err(|e| {
                error!(error = ?e, aggregate_id = %aggregate_id, "Failed to get DO stub");
                Error::StubError(format!("Could not fetch aggregate stub: {e}"))
            })
    }

    fn build_request(
        &self,
        url: &str,
        method: Method,
        headers: Headers,
        body: Option<String>,
    ) -> Result<Request> {
        let mut init = RequestInit::new();
        init.with_method(method).with_headers(headers);

        if let Some(body_content) = body {
            init.with_body(Some(body_content.into()));
        }

        let full_url = format!("{DURABLE_OBJECT_BASE_URL}{url}");

        Request::new_with_init(&full_url, &init).map_err(|e| {
            error!(error = ?e, url = %full_url, "Failed to create request");
            Error::RequestError(format!("Failed to create request: {e}"))
        })
    }

    async fn send_request(
        &self,
        aggregate_id: Uuid,
        url: &str,
        method: Method,
        headers: Headers,
        body: Option<String>,
    ) -> Result<Response> {
        let stub = self.get_stub(aggregate_id)?;
        let request = self.build_request(url, method, headers, body)?;

        stub.fetch_with_request(request).await.map_err(|e| {
            error!(error = ?e, aggregate_id = %aggregate_id, "DO fetch failed");
            Error::DurableObjectError(format!("Durable Object responded with error: {e}"))
        })
    }
}

pub type DurableObjectCQRSClientError = Error;
