use fern_labour_workers_shared::{ConfigTrait, SetupError};
use worker::Env;

#[derive(Clone)]
pub struct Config {
    pub subscription_token_salt: String,
    pub app_base_url: String,
    pub default_batch_size: i64,
    pub notification_auth_token: String,
}

impl ConfigTrait<Config> for Config {
    fn from_env(env: &Env) -> Result<Self, SetupError> {
        let subscription_token_salt = Config::parse(env, "SUBSCRIPTION_TOKEN_SALT")?;
        let app_base_url = Config::parse(env, "PUBLIC_URL")
            .unwrap_or_else(|_| "https://track.fernlabour.com".to_string());
        let default_batch_size = Config::parse(env, "DEFAULT_BATCH_SIZE").unwrap_or(10000);
        let notification_auth_token = Config::parse(env, "NOTIFICATION_SERVICE_AUTH_TOKEN")?;

        Ok(Self {
            subscription_token_salt,
            app_base_url,
            default_batch_size,
            notification_auth_token,
        })
    }
}
