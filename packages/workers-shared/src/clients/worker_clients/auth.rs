use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{debug, error};
use worker::Response;

use crate::clients::request_utils::build_json_post_request;

#[derive(Debug)]
pub enum AuthClientError {
    RequestFailed(String),
    ParseError(String),
    Unauthorised(String),
}

impl std::fmt::Display for AuthClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthClientError::RequestFailed(msg) => write!(f, "Request failed: {msg}"),
            AuthClientError::ParseError(msg) => write!(f, "Parse error: {msg}"),
            AuthClientError::Unauthorised(msg) => write!(f, "Unauthorised: {msg}"),
        }
    }
}

impl std::error::Error for AuthClientError {}

#[derive(Serialize)]
struct VerifyTokenRequest {
    token: String,
    allowed_issuers: Vec<String>,
}

#[derive(Deserialize)]
struct VerifyTokenResponse {
    user_id: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct User {
    pub user_id: String,
    pub email: Option<String>,
    pub phone_number: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub name: Option<String>,
}

impl User {
    pub fn internal(user_id: &str) -> Self {
        Self {
            user_id: format!("fern-labour-internal-{user_id}"),
            email: None,
            phone_number: None,
            first_name: None,
            last_name: None,
            name: None,
        }
    }
}

#[derive(Deserialize)]
struct AuthenticateResponse {
    user: User,
}

#[derive(Deserialize)]
struct ErrorResponse {
    message: String,
}

#[async_trait(?Send)]
pub trait AuthServiceClient {
    async fn verify_token(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<String, AuthClientError>;
    async fn authenticate(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<User, AuthClientError>;
}

pub struct FetcherAuthServiceClient {
    fetcher: Arc<worker::Fetcher>,
}

impl FetcherAuthServiceClient {
    pub fn create(fetcher: worker::Fetcher) -> Self {
        Self {
            fetcher: Arc::new(fetcher),
        }
    }

    async fn post_auth_request<T: Serialize>(
        &self,
        endpoint: &str,
        body: &T,
    ) -> Result<Response, AuthClientError> {
        let (init, _) = build_json_post_request(body, vec![("Content-Type", "application/json")])
            .map_err(AuthClientError::ParseError)?;

        self.fetcher.fetch(endpoint, Some(init)).await.map_err(|e| {
            error!(error = ?e, endpoint, "Auth service request failed");
            AuthClientError::RequestFailed(format!("Auth service request failed: {e}"))
        })
    }

    fn handle_error_response(status: u16, error_response: ErrorResponse) -> AuthClientError {
        match status {
            401 => AuthClientError::Unauthorised(error_response.message),
            _ => AuthClientError::RequestFailed(error_response.message),
        }
    }
}

#[async_trait(?Send)]
impl AuthServiceClient for FetcherAuthServiceClient {
    async fn verify_token(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<String, AuthClientError> {
        let body = VerifyTokenRequest {
            token: token.to_string(),
            allowed_issuers,
        };

        // The 'https://fernlabour.com' bit of the URL below does nothing since we are calling the
        // service directly. It is required to be a valid URL though.
        let mut response = self
            .post_auth_request("https://fernlabour.com/api/v1/auth/verify/", &body)
            .await?;

        match response.status_code() {
            200 => {
                let verify_response: VerifyTokenResponse = response.json().await.map_err(|e| {
                    error!(error = ?e, "Failed to parse verify response");
                    AuthClientError::ParseError(format!("Failed to parse verify response: {e}"))
                })?;

                debug!(user_id = %verify_response.user_id, "Token verified via auth service");
                Ok(verify_response.user_id)
            }
            status => {
                let error_response: ErrorResponse =
                    response.json().await.unwrap_or_else(|_| ErrorResponse {
                        message: format!("Unexpected status: {status}"),
                    });
                Err(Self::handle_error_response(status, error_response))
            }
        }
    }

    async fn authenticate(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<User, AuthClientError> {
        let body = VerifyTokenRequest {
            token: token.to_string(),
            allowed_issuers,
        };

        let mut response = self
            .post_auth_request("https://fernlabour.com/api/v1/auth/authenticate/", &body)
            .await?;

        match response.status_code() {
            200 => {
                let auth_response: AuthenticateResponse = response.json().await.map_err(|e| {
                    error!(error = ?e, "Failed to parse authenticate response");
                    AuthClientError::ParseError(format!(
                        "Failed to parse authenticate response: {e}"
                    ))
                })?;

                debug!(user_id = %auth_response.user.user_id, "Token authenticated via auth service");
                Ok(auth_response.user)
            }
            status => {
                let error_response: ErrorResponse =
                    response.json().await.unwrap_or_else(|_| ErrorResponse {
                        message: format!("Unexpected status: {status}"),
                    });
                Err(Self::handle_error_response(status, error_response))
            }
        }
    }
}
