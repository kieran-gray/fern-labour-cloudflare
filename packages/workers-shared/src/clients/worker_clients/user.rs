use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tracing::error;
use worker::{Fetcher, Response};

use crate::{
    User,
    clients::request_utils::{StatusCodeCategory, build_json_post_request},
};

#[derive(Debug)]
pub enum UserClientError {
    RequestFailed(String),
    ParseError(String),
    InternalError(String),
}

impl std::fmt::Display for UserClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserClientError::RequestFailed(msg) => write!(f, "Request failed: {msg}"),
            UserClientError::ParseError(msg) => write!(f, "Parse error: {msg}"),
            UserClientError::InternalError(msg) => write!(f, "Internal error: {msg}"),
        }
    }
}

impl std::error::Error for UserClientError {}

#[derive(Serialize, Deserialize)]
pub struct GetUsersRequest {
    pub user_ids: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct GetUsersResponse {
    pub users: Vec<User>,
}

#[derive(Serialize, Deserialize)]
pub struct GetUserResponse {
    pub user: User,
}

#[async_trait(?Send)]
pub trait UserServiceClient {
    async fn get_user(&self, user_id: &str) -> Result<User, UserClientError>;
    async fn get_users(&self, user_ids: Vec<&str>) -> Result<Vec<User>, UserClientError>;
}

pub struct FetcherUserServiceClient {
    fetcher: Fetcher,
}

impl FetcherUserServiceClient {
    pub fn create(fetcher: Fetcher) -> Self {
        Self { fetcher }
    }

    async fn post<T: Serialize>(
        &self,
        endpoint: &str,
        body: &T,
    ) -> Result<Response, UserClientError> {
        let (init, _) = build_json_post_request(body, vec![("Content-Type", "application/json")])
            .map_err(UserClientError::ParseError)?;

        self.fetcher.fetch(endpoint, Some(init)).await.map_err(|e| {
            error!(error = ?e, endpoint, "User service request failed");
            UserClientError::RequestFailed(format!("User service request failed: {e}"))
        })
    }

    async fn get(&self, endpoint: &str) -> Result<Response, UserClientError> {
        self.fetcher.fetch(endpoint, None).await.map_err(|e| {
            error!(error = ?e, endpoint, "User service request failed");
            UserClientError::RequestFailed(format!("User service request failed: {e}"))
        })
    }
}

#[async_trait(?Send)]
impl UserServiceClient for FetcherUserServiceClient {
    async fn get_user(&self, user_id: &str) -> Result<User, UserClientError> {
        let mut response = self
            .get(&format!("https://fernlabour.com/api/v1/user/{user_id}"))
            .await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                let user_response: GetUserResponse = response
                    .json()
                    .await
                    .map_err(|e| UserClientError::ParseError(e.to_string()))?;
                Ok(user_response.user)
            }
            StatusCodeCategory::ClientError => Err(UserClientError::RequestFailed(format!(
                "Client error: {status}"
            ))),
            StatusCodeCategory::ServerError => Err(UserClientError::InternalError(format!(
                "Server error: {status}"
            ))),
            StatusCodeCategory::Unknown => Err(UserClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }

    async fn get_users(&self, user_ids: Vec<&str>) -> Result<Vec<User>, UserClientError> {
        let request = GetUsersRequest {
            user_ids: user_ids.iter().map(|u| u.to_string()).collect(),
        };

        let mut response = self
            .post("https://fernlabour.com/api/v1/users", &request)
            .await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                let user_response: GetUsersResponse = response
                    .json()
                    .await
                    .map_err(|e| UserClientError::ParseError(e.to_string()))?;
                Ok(user_response.users)
            }
            StatusCodeCategory::ClientError => Err(UserClientError::RequestFailed(format!(
                "Client error: {status}"
            ))),
            StatusCodeCategory::ServerError => Err(UserClientError::InternalError(format!(
                "Server error: {status}"
            ))),
            StatusCodeCategory::Unknown => Err(UserClientError::RequestFailed(format!(
                "Unexpected status: {status}"
            ))),
        }
    }
}
