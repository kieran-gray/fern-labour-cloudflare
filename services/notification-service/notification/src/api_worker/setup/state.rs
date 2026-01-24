use anyhow::{Context, Result};
use fern_labour_notifications_shared::service_clients::DispatchClient;
use fern_labour_workers_shared::{
    ConfigTrait,
    clients::{
        AuthServiceClient, DurableObjectCQRSClient, FetcherAuthServiceClient, FetcherDispatchClient,
    },
};
use worker::Env;

use crate::{
    api_worker::Config,
    durable_object::read_side::read_models::{
        D1NotificationActivityRepository, D1NotificationDetailRepository,
        D1NotificationStatusRepository,
        notification_activity::repository::NotificationActivityRepositoryTrait,
        notification_detail::repository::NotificationDetailRepositoryTrait,
        notification_status::repository::NotificationStatusRepositoryTrait,
    },
};

pub struct AppState {
    pub config: Config,
    pub auth_service: Box<dyn AuthServiceClient>,
    pub notification_detail_repository: Box<dyn NotificationDetailRepositoryTrait>,
    pub notification_status_repository: Box<dyn NotificationStatusRepositoryTrait>,
    pub notification_activity_repository: Box<dyn NotificationActivityRepositoryTrait>,
    pub do_client: DurableObjectCQRSClient,
    pub dispatch_client: Box<dyn DispatchClient>,
}

impl AppState {
    fn create_notification_status_repository(
        env: &Env,
    ) -> Result<Box<dyn NotificationStatusRepositoryTrait>> {
        let notification_db: worker::D1Database = env
            .d1("NOTIFICATION_READ_DB")
            .context("Missing binding NOTIFICATION_READ_DB")?;
        Ok(Box::new(D1NotificationStatusRepository::create(
            notification_db,
        )))
    }

    fn create_notification_detail_repository(
        env: &Env,
    ) -> Result<Box<dyn NotificationDetailRepositoryTrait>> {
        let notification_db: worker::D1Database = env
            .d1("NOTIFICATION_READ_DB")
            .context("Missing binding NOTIFICATION_READ_DB")?;
        Ok(Box::new(D1NotificationDetailRepository::create(
            notification_db,
        )))
    }

    fn create_notification_activity_repository(
        env: &Env,
    ) -> Result<Box<dyn NotificationActivityRepositoryTrait>> {
        let notification_db: worker::D1Database = env
            .d1("NOTIFICATION_READ_DB")
            .context("Missing binding NOTIFICATION_READ_DB")?;
        Ok(Box::new(D1NotificationActivityRepository::create(
            notification_db,
        )))
    }

    fn create_do_client(env: &Env) -> Result<DurableObjectCQRSClient> {
        let aggregate_namespace = env
            .durable_object("NOTIFICATION_AGGREGATE")
            .context("Missing binding NOTIFICATION_AGGREGATE")?;

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

    fn create_dispatch(env: &Env, auth_token: &str) -> Result<Box<dyn DispatchClient>> {
        let dispatch_fetcher = env
            .service("DISPATCH_SERVICE_API")
            .context("Missing binding DISPATCH_SERVICE_API")?;

        Ok(Box::new(FetcherDispatchClient::create(
            dispatch_fetcher,
            auth_token.to_string(),
        )))
    }

    pub fn from_env(env: &Env) -> Result<Self> {
        let config = Config::from_env(env)?;
        let auth_service = Self::create_auth_service(env)?;
        let notification_detail_repository = Self::create_notification_detail_repository(env)?;
        let notification_status_repository = Self::create_notification_status_repository(env)?;
        let notification_activity_repository = Self::create_notification_activity_repository(env)?;

        let do_client = Self::create_do_client(env)?;
        let dispatch_client = Self::create_dispatch(env, &config.internal_service_token)?;

        Ok(Self {
            config,
            auth_service,
            notification_detail_repository,
            notification_status_repository,
            notification_activity_repository,
            do_client,
            dispatch_client,
        })
    }
}
