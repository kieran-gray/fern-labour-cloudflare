use anyhow::{Result, anyhow};
use fern_labour_workers_shared::{
    User,
    clients::request_utils::{StatusCodeCategory, create_headers},
};
use serde::Deserialize;
use tracing::info;
use worker::{Fetch, Method, Request, RequestInit, Response, Url};

#[derive(Deserialize)]
struct ClerkEmailAddress {
    id: String,
    email_address: String,
}

impl ClerkEmailAddress {
    pub fn email(&self) -> String {
        self.email_address.clone()
    }
}

#[derive(Deserialize)]
struct ClerkPhoneNumber {
    id: String,
    phone_number: String,
}

impl ClerkPhoneNumber {
    pub fn number(&self) -> String {
        self.phone_number.clone()
    }
}

#[derive(Deserialize)]
struct ClerkUser {
    id: String,
    first_name: Option<String>,
    last_name: Option<String>,
    primary_email_address_id: Option<String>,
    email_addresses: Vec<ClerkEmailAddress>,
    primary_phone_number_id: Option<String>,
    phone_numbers: Vec<ClerkPhoneNumber>,
}

impl Into<User> for ClerkUser {
    fn into(self) -> User {
        let email = match self.primary_email_address_id {
            Some(id) => self
                .email_addresses
                .iter()
                .find(|email| email.id == id)
                .and_then(|val| Some(val.email())),
            None => None,
        };
        let phone_number = match self.primary_phone_number_id {
            Some(id) => self
                .phone_numbers
                .iter()
                .find(|num| num.id == id)
                .and_then(|val| Some(val.number())),
            None => None,
        };
        let name = match (&self.first_name, &self.last_name) {
            (Some(first), Some(last)) => Some(format!("{} {}", first, last)),
            (Some(name), None) | (None, Some(name)) => Some(name.clone()),
            _ => None,
        };

        User {
            user_id: self.id,
            email,
            phone_number,
            first_name: self.first_name,
            last_name: self.last_name,
            name,
        }
    }
}

pub struct ClerkApiClient {
    clerk_secret_key: String,
    clerk_base_url: String,
}

impl ClerkApiClient {
    pub fn create(clerk_secret_key: String) -> Self {
        Self {
            clerk_secret_key,
            clerk_base_url: "https://api.clerk.com/v1/users".to_string(),
        }
    }

    async fn get(&self, url: Url) -> Result<Response> {
        let mut init = RequestInit::new();
        init.with_method(Method::Get);

        let headers = create_headers(vec![(
            "Authorization",
            &format!("Bearer {}", self.clerk_secret_key),
        )])
        .map_err(|e| anyhow!(e))?;

        init.with_headers(headers);

        info!(url = ?url.as_str(), "Fetching users from clerk");

        let request = Request::new_with_init(url.as_str(), &init)
            .map_err(|e| anyhow!("Failed to create request: {}", e))?;

        Fetch::Request(request)
            .send()
            .await
            .map_err(|e| anyhow!("Clerk Error: {e}"))
    }

    pub async fn get_user(&self, user_id: &str) -> Result<User> {
        let url = Url::parse(&format!("{}/{}", self.clerk_base_url, user_id))
            .map_err(|e| anyhow!("Failed to parse url: {e}"))?;

        let mut response = self.get(url).await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                let clerk_user: ClerkUser = response
                    .json()
                    .await
                    .map_err(|e| anyhow!("Failed to parse response: {e}"))?;
                Ok(clerk_user.into())
            }
            _ => Err(anyhow!("Clerk failure")),
        }
    }

    pub async fn get_users(&self, user_ids: Vec<String>) -> Result<Vec<User>> {
        let params: Vec<(&str, &str)> =
            user_ids.iter().map(|id| ("user_id", id.as_str())).collect();
        let url = Url::parse_with_params(&self.clerk_base_url, &params)
            .map_err(|e| anyhow!("Failed to parse url: {e}"))?;

        let mut response = self.get(url).await?;

        let status = response.status_code();
        match StatusCodeCategory::from_code(status) {
            StatusCodeCategory::Success => {
                let clerk_users: Vec<ClerkUser> = response
                    .json()
                    .await
                    .map_err(|e| anyhow!("Failed to parse response: {e}"))?;

                let users: Vec<User> = clerk_users
                    .into_iter()
                    .map(|clerk_user| clerk_user.into())
                    .collect();
                Ok(users)
            }
            _ => Err(anyhow!("Clerk failure")),
        }
    }
}
