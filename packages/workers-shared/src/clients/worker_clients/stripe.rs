use async_trait::async_trait;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Deserialize, Serialize};
use tracing::error;
use worker::{Fetch, Headers, Method, Request, RequestInit};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckoutSessionResponse {
    pub id: String,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StripePrice {
    pub id: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StripePriceList {
    pub data: Vec<StripePrice>,
}

#[derive(Debug, Clone)]
pub struct CheckoutSessionRequest {
    pub success_url: String,
    pub cancel_url: String,
    pub price_lookup_key: String,
    pub metadata: Vec<(String, String)>,
}

#[derive(Debug)]
pub enum StripeError {
    RequestFailed(String),
    InvalidResponse(String),
    MissingUrl,
    PriceNotFound(String),
}

impl std::fmt::Display for StripeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StripeError::RequestFailed(msg) => write!(f, "Stripe request failed: {}", msg),
            StripeError::InvalidResponse(msg) => write!(f, "Invalid Stripe response: {}", msg),
            StripeError::MissingUrl => write!(f, "Checkout session URL missing from response"),
            StripeError::PriceNotFound(key) => {
                write!(f, "No active price found for lookup_key: {}", key)
            }
        }
    }
}

impl std::error::Error for StripeError {}

#[async_trait(?Send)]
pub trait StripeClient: Send + Sync {
    async fn create_checkout_session(
        &self,
        request: CheckoutSessionRequest,
    ) -> Result<CheckoutSessionResponse, StripeError>;
}

pub struct WorkerStripeClient {
    api_key: String,
}

impl WorkerStripeClient {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    fn create_auth_headers(&self) -> Result<Headers, StripeError> {
        let auth = BASE64.encode(format!("{}:", self.api_key));
        let headers = Headers::new();
        headers
            .set("Authorization", &format!("Basic {}", auth))
            .map_err(|e| StripeError::RequestFailed(format!("Failed to set auth header: {}", e)))?;
        headers
            .set("Content-Type", "application/x-www-form-urlencoded")
            .map_err(|e| {
                StripeError::RequestFailed(format!("Failed to set content-type header: {}", e))
            })?;
        Ok(headers)
    }

    async fn get_price_by_lookup_key(&self, lookup_key: &str) -> Result<String, StripeError> {
        let url = format!(
            "https://api.stripe.com/v1/prices?lookup_keys[]={}&active=true",
            urlencoding::encode(lookup_key)
        );

        let headers = self.create_auth_headers()?;

        let mut init = RequestInit::new();
        init.with_method(Method::Get);
        init.with_headers(headers);

        let req = Request::new_with_init(&url, &init)
            .map_err(|e| StripeError::RequestFailed(format!("Failed to create request: {}", e)))?;

        let mut response = Fetch::Request(req).send().await.map_err(|e| {
            error!(error = ?e, "Stripe price lookup failed");
            StripeError::RequestFailed(format!("HTTP request failed: {}", e))
        })?;

        let status = response.status_code();
        if status < 200 || status >= 300 {
            let error_text = response.text().await.unwrap_or_default();
            error!(status = status, error = ?error_text, "Stripe price lookup error");
            return Err(StripeError::RequestFailed(format!(
                "Stripe returned status {}: {}",
                status, error_text
            )));
        }

        let price_list: StripePriceList = response.json().await.map_err(|e| {
            error!(error = ?e, "Failed to parse Stripe price list");
            StripeError::InvalidResponse(format!("Failed to parse response: {}", e))
        })?;

        price_list
            .data
            .first()
            .map(|p| p.id.clone())
            .ok_or_else(|| StripeError::PriceNotFound(lookup_key.to_string()))
    }

    fn build_checkout_form_body(request: &CheckoutSessionRequest, price_id: &str) -> String {
        let mut params = vec![
            ("mode".to_string(), "payment".to_string()),
            ("success_url".to_string(), request.success_url.clone()),
            ("cancel_url".to_string(), request.cancel_url.clone()),
            ("line_items[0][price]".to_string(), price_id.to_string()),
            ("line_items[0][quantity]".to_string(), "1".to_string()),
        ];

        for (key, value) in &request.metadata {
            params.push((format!("metadata[{}]", key), value.clone()));
        }

        params
            .iter()
            .map(|(k, v)| format!("{}={}", urlencoding::encode(k), urlencoding::encode(v)))
            .collect::<Vec<_>>()
            .join("&")
    }
}

#[async_trait(?Send)]
impl StripeClient for WorkerStripeClient {
    async fn create_checkout_session(
        &self,
        request: CheckoutSessionRequest,
    ) -> Result<CheckoutSessionResponse, StripeError> {
        let price_id = self
            .get_price_by_lookup_key(&request.price_lookup_key)
            .await?;

        let url = "https://api.stripe.com/v1/checkout/sessions";
        let body = Self::build_checkout_form_body(&request, &price_id);
        let headers = self.create_auth_headers()?;

        let mut init = RequestInit::new();
        init.with_method(Method::Post);
        init.with_headers(headers);
        init.with_body(Some(body.into()));

        let req = Request::new_with_init(url, &init)
            .map_err(|e| StripeError::RequestFailed(format!("Failed to create request: {}", e)))?;

        let mut response = Fetch::Request(req).send().await.map_err(|e| {
            error!(error = ?e, "Stripe API request failed");
            StripeError::RequestFailed(format!("HTTP request failed: {}", e))
        })?;

        let status = response.status_code();
        if status < 200 || status >= 300 {
            let error_text = response.text().await.unwrap_or_default();
            error!(status = status, error = ?error_text, "Stripe API error response");
            return Err(StripeError::RequestFailed(format!(
                "Stripe returned status {}: {}",
                status, error_text
            )));
        }

        let session: CheckoutSessionResponse = response.json().await.map_err(|e| {
            error!(error = ?e, "Failed to parse Stripe response");
            StripeError::InvalidResponse(format!("Failed to parse response: {}", e))
        })?;

        if session.url.is_none() {
            return Err(StripeError::MissingUrl);
        }

        Ok(session)
    }
}
