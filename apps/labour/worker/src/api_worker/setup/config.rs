use fern_labour_workers_shared::{ConfigTrait, SetupError};
use worker::Env;

#[derive(Clone)]
pub struct Config {
    pub allowed_origins: Vec<String>,
    pub stripe_webhook_secret: String,
}

impl ConfigTrait<Config> for Config {
    fn from_env(env: &Env) -> Result<Self, SetupError> {
        let allowed_origins = Config::parse_csv(env, "ALLOWED_ORIGINS")?;
        let stripe_webhook_secret = Config::parse(env, "STRIPE_WEBHOOK_SECRET")?;

        Ok(Self {
            allowed_origins,
            stripe_webhook_secret,
        })
    }
}
