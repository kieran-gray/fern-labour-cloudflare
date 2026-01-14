use anyhow::{Context, Result};
use fern_labour_event_sourcing_rs::CommandEnvelope;
use fern_labour_notifications_shared::{QueueMessage, QueueProducerTrait};
use fern_labour_workers_shared::{ConfigTrait, NotificationQueueProducer};
use std::rc::Rc;
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
        persistence::repository::D1TrackedNotificationRepository,
    },
    setup::config::Config,
};

pub struct AppState {
    pub notification_router: NotificationRouter,
    pub webhook_interpreter: WebhookInterpreterService,
    pub webhook_verification: WebhookVerificationService,
    pub command_producer: Box<dyn QueueProducerTrait<Envelope = CommandEnvelope<QueueMessage>>>,
    pub internal_service_token: String,
}

impl AppState {
    fn create_command_producer(
        env: &Env,
    ) -> Result<Box<dyn QueueProducerTrait<Envelope = CommandEnvelope<QueueMessage>>>> {
        let queue = env
            .queue("NOTIFICATION_COMMAND_BUS")
            .context("Failed to load command bus")?;
        Ok(NotificationQueueProducer::create(queue))
    }

    pub fn from_env(env: &Env) -> Result<Self> {
        let config = Config::from_env(env).unwrap();

        let tracked_notification_repo = Rc::new(D1TrackedNotificationRepository::create(
            env.d1("DB").unwrap(),
        ));

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

        let notification_router =
            NotificationRouter::create(gateways, tracked_notification_repo.clone());

        let webhook_interpreter =
            WebhookInterpreterService::create(tracked_notification_repo, translators);

        let webhook_verification = WebhookVerificationService::create(verifiers);

        let command_producer = Self::create_command_producer(env)?;

        Ok(Self {
            notification_router,
            webhook_interpreter,
            webhook_verification,
            command_producer,
            internal_service_token: config.internal_service_token,
        })
    }
}
