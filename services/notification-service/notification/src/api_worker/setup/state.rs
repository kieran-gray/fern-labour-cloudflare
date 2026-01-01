use anyhow::{Context, Result};
use fern_labour_notifications_shared::service_clients::{DispatchClient, GenerationClient};
use fern_labour_workers_shared::{
    ConfigTrait,
    clients::{
        AuthServiceClient, DurableObjectCQRSClient, FetcherAuthServiceClient,
        FetcherDispatchClient, FetcherGenerationClient,
    },
};
use worker::Env;

use crate::{
    api_worker::Config,
    read_models::{
        notification_activity::{
            D1NotificationActivityRepository,
            query::{NotificationActivityQuery, NotificationActivityQueryHandler},
            repository::NotificationActivityRepository,
        },
        notification_detail::{
            D1NotificationDetailRepository,
            query::{NotificationDetailQuery, NotificationDetailQueryHandler},
        },
        notification_status::{
            D1NotificationStatusRepository,
            query::{NotificationStatusQuery, NotificationStatusQueryHandler},
        },
    },
};

pub struct AppState {
    pub config: Config,
    pub auth_service: Box<dyn AuthServiceClient>,
    pub notification_detail_query: Box<dyn NotificationDetailQueryHandler>,
    pub notification_status_query: Box<dyn NotificationStatusQueryHandler>,
    pub notification_activity_query: Box<dyn NotificationActivityQueryHandler>,
    pub notification_activity_repository: Box<dyn NotificationActivityRepository>,
    pub do_client: DurableObjectCQRSClient,
    pub generation_client: Box<dyn GenerationClient>,
    pub dispatch_client: Box<dyn DispatchClient>,
}

impl AppState {
    fn create_notification_status_query(
        env: &Env,
    ) -> Result<Box<dyn NotificationStatusQueryHandler>> {
        let notification_status_db: worker::D1Database = env
            .d1("NOTIFICATION_STATUS_DB")
            .context("Missing binding NOTIFICATION_STATUS_DB")?;
        let notification_status_repository = Box::new(D1NotificationStatusRepository::create(
            notification_status_db,
        ));
        Ok(Box::new(NotificationStatusQuery::create(
            notification_status_repository,
        )))
    }

    fn create_notification_detail_query(
        env: &Env,
    ) -> Result<Box<dyn NotificationDetailQueryHandler>> {
        let notification_detail_db: worker::D1Database = env
            .d1("NOTIFICATION_DETAIL_DB")
            .context("Missing binding NOTIFICATION_DETAIL_DB")?;
        let notification_detail_repository = Box::new(D1NotificationDetailRepository::create(
            notification_detail_db,
        ));
        Ok(Box::new(NotificationDetailQuery::create(
            notification_detail_repository,
        )))
    }

    fn create_notification_activity_query(
        env: &Env,
    ) -> Result<Box<dyn NotificationActivityQueryHandler>> {
        let notification_activity_db: worker::D1Database = env
            .d1("NOTIFICATION_ANALYTICS_DB")
            .context("Missing binding NOTIFICATION_ANALYTICS_DB")?;
        let notification_activity_repository = Box::new(D1NotificationActivityRepository::create(
            notification_activity_db,
        ));
        Ok(Box::new(NotificationActivityQuery::create(
            notification_activity_repository,
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

    fn create_generation(env: &Env, auth_token: &str) -> Result<Box<dyn GenerationClient>> {
        let generation_fetcher = env
            .service("GENERATION_SERVICE_API")
            .context("Missing binding GENERATION_SERVICE_API")?;

        Ok(Box::new(FetcherGenerationClient::create(
            generation_fetcher,
            auth_token.to_string(),
        )))
    }

    pub fn from_env(env: &Env) -> Result<Self> {
        let config = Config::from_env(env)?;
        let auth_service = Self::create_auth_service(env)?;
        let notification_detail_query = Self::create_notification_detail_query(env)?;
        let notification_status_query = Self::create_notification_status_query(env)?;
        let notification_activity_query = Self::create_notification_activity_query(env)?;

        // TODO analytics service
        let notification_activity_db: worker::D1Database = env
            .d1("NOTIFICATION_ANALYTICS_DB")
            .context("Missing binding NOTIFICATION_ANALYTICS_DB")?;
        let notification_activity_repository = Box::new(D1NotificationActivityRepository::create(
            notification_activity_db,
        ));

        let do_client = Self::create_do_client(env)?;
        let generation_client = Self::create_generation(env, &config.internal_auth_token)?;
        let dispatch_client = Self::create_dispatch(env, &config.internal_auth_token)?;

        Ok(Self {
            config,
            auth_service,
            notification_detail_query,
            notification_status_query,
            notification_activity_query,
            notification_activity_repository,
            do_client,
            generation_client,
            dispatch_client,
        })
    }
}
