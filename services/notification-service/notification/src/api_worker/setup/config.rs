use fern_labour_workers_shared::{ConfigTrait, SetupError};
use worker::Env;

#[derive(Clone)]
pub struct Config {
    pub allowed_origins: Vec<String>,
    pub internal_service_token: String,
}

impl ConfigTrait<Config> for Config {
    fn from_env(env: &Env) -> Result<Self, SetupError> {
        let allowed_origins = Config::parse_csv(env, "ALLOWED_ORIGINS")?;
        let internal_service_token: String = Config::parse(env, "INTERNAL_SERVICE_TOKEN")?;

        Ok(Self {
            allowed_origins,
            internal_service_token,
        })
    }
}
