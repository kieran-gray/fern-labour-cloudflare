use anyhow::Result;
use fern_labour_workers_shared::ConfigTrait;
use worker::Env;

use crate::{
    application::{
        dispatch::{NotificationGatewayTrait, NotificationRouter},
        webhook::{
            ProviderStatusTranslator, WebhookInterpreterService, WebhookVerificationService,
            WebhookVerifier,
        },
    },
    infrastructure::{
        ResendEmailNotificationGateway, ResendStatusTranslator, ResendWebhookVerifier,
        TwilioSmsNotificationGateway, TwilioStatusTranslator, TwilioWebhookVerifier,
        TwilioWhatsappNotificationGateway,
    },
    setup::config::Config,
};

pub struct AppState {
    pub notification_router: NotificationRouter,
    pub webhook_interpreter: WebhookInterpreterService,
    pub webhook_verification: WebhookVerificationService,
    pub internal_service_token: String,
}

impl AppState {
    pub fn from_env(env: &Env) -> Result<Self> {
        let config = Config::from_env(env)?;

        let gateways: Vec<Box<dyn NotificationGatewayTrait>> = vec![
            Box::new(TwilioSmsNotificationGateway::create(&config.twilio)),
            Box::new(TwilioWhatsappNotificationGateway::create(&config.twilio)),
            Box::new(ResendEmailNotificationGateway::create(&config.resend)),
        ];
        let verifiers: Vec<Box<dyn WebhookVerifier>> = vec![
            Box::new(TwilioWebhookVerifier::create(
                config.twilio.auth_token.clone(),
                config.twilio.webhook_url.clone(),
            )),
            Box::new(ResendWebhookVerifier::create(
                config.resend.webhook_signing_secret.clone(),
            )),
        ];
        let translators: Vec<Box<dyn ProviderStatusTranslator>> = vec![
            Box::new(TwilioStatusTranslator),
            Box::new(ResendStatusTranslator),
        ];

        let notification_router = NotificationRouter::create(gateways);

        let webhook_interpreter = WebhookInterpreterService::create(translators);

        let webhook_verification = WebhookVerificationService::create(verifiers);

        Ok(Self {
            notification_router,
            webhook_interpreter,
            webhook_verification,
            internal_service_token: config.internal_service_token,
        })
    }
}
