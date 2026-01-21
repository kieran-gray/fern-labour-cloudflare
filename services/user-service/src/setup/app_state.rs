use anyhow::Result;
use fern_labour_workers_shared::ConfigTrait;
use worker::Env;

use crate::{infrastructure::clerk_client::ClerkApiClient, setup::config::Config};

pub struct AppState {
    pub clerk_client: ClerkApiClient,
}

impl AppState {
    pub fn from_env(env: &Env) -> Result<Self> {
        let config = Config::from_env(env)?;

        let clerk_client = ClerkApiClient::create(config.clerk_secret_key);

        Ok(Self { clerk_client })
    }
}
