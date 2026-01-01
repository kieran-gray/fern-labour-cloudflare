use serde::Serialize;
use worker::{Headers, Method, RequestInit};

pub fn build_json_post_request<T: Serialize>(
    body: &T,
    headers: Vec<(&str, &str)>,
) -> Result<(RequestInit, Vec<u8>), String> {
    let body_bytes =
        serde_json::to_vec(body).map_err(|e| format!("Failed to serialize request: {e}"))?;

    let worker_headers = create_headers(headers)?;

    let mut init = RequestInit::new();
    init.with_method(Method::Post);
    init.with_headers(worker_headers);
    init.with_body(Some(body_bytes.clone().into()));

    Ok((init, body_bytes))
}

pub fn create_headers(headers: Vec<(&str, &str)>) -> Result<Headers, String> {
    let worker_headers = Headers::new();
    for (name, value) in headers {
        worker_headers
            .set(name, value)
            .map_err(|e| format!("Failed to set header {}: {}", name, e))?;
    }
    Ok(worker_headers)
}

pub fn internal_auth_headers<'a>(
    service_id: &'a str,
    auth_token: &'a str,
) -> Vec<(&'a str, &'a str)> {
    vec![
        ("Content-Type", "application/json"),
        ("X-Service-ID", service_id),
        ("X-Internal-Auth", auth_token),
    ]
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StatusCodeCategory {
    Success,
    ClientError,
    ServerError,
    Unknown,
}

impl StatusCodeCategory {
    pub fn from_code(code: u16) -> Self {
        match code {
            200..=299 => Self::Success,
            400..=499 => Self::ClientError,
            500..=599 => Self::ServerError,
            _ => Self::Unknown,
        }
    }
}
