use fern_labour_workers_shared::{ConfigTrait, SetupError};
use worker::Env;

#[derive(Clone)]
pub struct Config {
    pub allowed_origins: Vec<String>,
    pub internal_service_token: String,
    pub resend: ResendConfig,
    pub twilio: TwilioConfig,
}

impl ConfigTrait<Config> for Config {
    fn from_env(env: &Env) -> Result<Self, SetupError> {
        let allowed_origins = Config::parse_csv(env, "ALLOWED_ORIGINS")?;
        let internal_service_token = Config::parse(env, "INTERNAL_SERVICE_TOKEN")?;
        let resend = ResendConfig::from_env(env)?;
        let twilio = TwilioConfig::from_env(env)?;

        Ok(Self {
            allowed_origins,
            internal_service_token,
            resend,
            twilio,
        })
    }
}

#[derive(Clone)]
pub struct SendgridConfig {
    pub api_key: String,
    pub from_email: String,
    pub from_name: String,
    pub webhook_verification_key: String,
}

#[derive(Clone)]
pub struct ResendConfig {
    pub api_key: String,
    pub from_email: String,
    pub from_name: String,
    pub webhook_signing_secret: String,
}

impl ConfigTrait<ResendConfig> for ResendConfig {
    fn from_env(env: &Env) -> Result<ResendConfig, SetupError> {
        let api_key = Config::parse(env, "RESEND_API_KEY")?;
        let from_email = Config::parse(env, "EMAILS_FROM_EMAIL")?;
        let from_name = Config::parse(env, "EMAILS_FROM_NAME")?;
        let webhook_signing_secret = Config::parse(env, "RESEND_WEBHOOK_SIGNING_SECRET")?;

        Ok(Self {
            api_key,
            from_email,
            from_name,
            webhook_signing_secret,
        })
    }
}

#[derive(Clone)]
pub struct TwilioConfig {
    pub account_sid: String,
    pub auth_token: String,
    pub messaging_service_sid: String,
    pub webhook_url: String,
}

impl ConfigTrait<TwilioConfig> for TwilioConfig {
    fn from_env(env: &Env) -> Result<TwilioConfig, SetupError> {
        let account_sid = Config::parse(env, "TWILIO_ACCOUNT_SID")?;
        let auth_token = Config::parse(env, "TWILIO_AUTH_TOKEN")?;
        let messaging_service_sid = Config::parse(env, "TWILIO_MESSAGING_SERVICE_SID")?;
        let webhook_url = Config::parse(env, "TWILIO_WEBHOOK_URL")?;

        Ok(Self {
            account_sid,
            auth_token,
            messaging_service_sid,
            webhook_url,
        })
    }
}
