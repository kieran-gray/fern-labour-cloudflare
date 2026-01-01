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
        SendgridEmailNotificationGateway, SendgridStatusTranslator, SendgridWebhookVerifier,
        SesEmailNotificationGateway, TwilioSmsNotificationGateway, TwilioStatusTranslator,
        TwilioWebhookVerifier, TwilioWhatsappNotificationGateway,
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

        let mut gateways: Vec<Box<dyn NotificationGatewayTrait>> = vec![];
        let mut verifiers: Vec<Box<dyn WebhookVerifier>> = vec![];
        let mut translators: Vec<Box<dyn ProviderStatusTranslator>> = vec![];

        if let Some(ref twilio_config) = config.twilio {
            gateways.push(Box::new(TwilioSmsNotificationGateway::create(
                twilio_config,
            )));
            gateways.push(Box::new(TwilioWhatsappNotificationGateway::create(
                twilio_config,
            )));
            verifiers.push(Box::new(TwilioWebhookVerifier::create(
                twilio_config.auth_token.clone(),
                twilio_config.webhook_url.clone(),
            )));
            translators.push(Box::new(TwilioStatusTranslator));
        }

        if let Some(ref ses_config) = config.ses {
            gateways.push(Box::new(SesEmailNotificationGateway::create(ses_config)));
        } else if let Some(ref resend_config) = config.resend {
            gateways.push(Box::new(ResendEmailNotificationGateway::create(
                resend_config,
            )));
            verifiers.push(Box::new(ResendWebhookVerifier::create(
                resend_config.webhook_signing_secret.clone(),
            )));
            translators.push(Box::new(ResendStatusTranslator));
        } else if let Some(ref sendgrid_config) = config.sendgrid {
            gateways.push(Box::new(SendgridEmailNotificationGateway::create(
                sendgrid_config,
            )));
            verifiers.push(Box::new(SendgridWebhookVerifier::create(
                sendgrid_config.webhook_verification_key.clone(),
            )));
            translators.push(Box::new(SendgridStatusTranslator));
        }

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
