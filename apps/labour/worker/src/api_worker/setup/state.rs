use anyhow::{Context, Result};
use fern_labour_workers_shared::{
    ConfigTrait,
    clients::{AuthServiceClient, DurableObjectCQRSClient, FetcherAuthServiceClient},
};
use worker::Env;

use crate::{
    api_worker::Config,
    durable_object::read_side::read_models::{
        labour_status::{D1LabourStatusRepository, LabourStatusRepositoryTrait},
        subscription_status::{D1SubscriptionStatusRepository, SubscriptionStatusRepositoryTrait},
    },
};

pub struct AppState {
    pub config: Config,
    pub auth_service: Box<dyn AuthServiceClient>,
    pub do_client: DurableObjectCQRSClient,
    pub labour_status_repository: Box<dyn LabourStatusRepositoryTrait>,
    pub subscription_status_repository: Box<dyn SubscriptionStatusRepositoryTrait>,
}

impl AppState {
    fn create_do_client(env: &Env) -> Result<DurableObjectCQRSClient> {
        let aggregate_namespace = env
            .durable_object("LABOUR_CIRCLE")
            .context("Missing binding LABOUR_CIRCLE")?;

        Ok(DurableObjectCQRSClient::create(aggregate_namespace))
    }

    fn create_auth_service(env: &Env) -> Result<Box<dyn AuthServiceClient>> {
        let auth_service_fetcher = env
            .service("AUTH_SERVICE_API")
            .context("Missing binding AUTH_SERVICE_API")?;

        Ok(Box::new(FetcherAuthServiceClient::create(
            auth_service_fetcher,
        )))
    }

    fn create_labour_status_repository(env: &Env) -> Result<Box<dyn LabourStatusRepositoryTrait>> {
        let binding = "READ_MODEL_DB";
        let db = env
            .d1(binding)
            .context(format!("Failed to load {}", binding))?;
        Ok(Box::new(D1LabourStatusRepository::create(db)))
    }

    fn create_subscription_status_repository(
        env: &Env,
    ) -> Result<Box<dyn SubscriptionStatusRepositoryTrait>> {
        let binding = "READ_MODEL_DB";
        let db = env
            .d1(binding)
            .context(format!("Failed to load {}", binding))?;
        Ok(Box::new(D1SubscriptionStatusRepository::create(db)))
    }

    pub fn from_env(env: &Env) -> Result<Self> {
        let config = Config::from_env(env)?;
        let auth_service = Self::create_auth_service(env)?;

        let do_client = Self::create_do_client(env)?;

        let labour_status_repository = Self::create_labour_status_repository(env)?;
        let subscription_status_repository = Self::create_subscription_status_repository(env)?;

        Ok(Self {
            config,
            auth_service,
            do_client,
            labour_status_repository,
            subscription_status_repository,
        })
    }
}
