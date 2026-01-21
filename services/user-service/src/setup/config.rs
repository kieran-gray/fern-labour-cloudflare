use fern_labour_workers_shared::{ConfigTrait, SetupError};
use worker::Env;

#[derive(Clone)]
pub struct Config {
    pub allowed_origins: Vec<String>,
    pub clerk_secret_key: String,
}

impl ConfigTrait<Config> for Config {
    fn from_env(env: &Env) -> Result<Self, SetupError> {
        let allowed_origins = Config::parse_csv(env, "ALLOWED_ORIGINS")?;
        let clerk_secret_key = Config::parse(env, "CLERK_SECRET_KEY")?;

        Ok(Self {
            allowed_origins,
            clerk_secret_key,
        })
    }
}
