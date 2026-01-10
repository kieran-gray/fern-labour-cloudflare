use std::rc::Rc;

use anyhow::{Context, Result};

use fern_labour_workers_shared::{
    ConfigTrait,
    clients::{FetcherNotificationClient, WorkerStripeClient},
};
use worker::{Env, State};

use fern_labour_event_sourcing_rs::{
    AggregateRepositoryTrait, CacheTrait, CachedAggregateRepository, CheckpointRepository,
    EventStoreTrait, IncrementalAsyncProjector, SyncProjector,
};

use crate::durable_object::{
    read_side::{
        checkpoint_repository::SqlCheckpointRepository,
        projection_processors::{
            async_processor::AsyncProjectionProcessor, sync_processor::SyncProjectionProcessor,
        },
        read_models::{
            contractions::{
                ContractionReadModelProjector, ContractionReadModelQuery, SqlContractionRepository,
            },
            events::query::EventQuery,
            labour::{LabourReadModelProjector, LabourReadModelQuery, SqlLabourRepository},
            labour_status::{D1LabourStatusRepository, LabourStatusReadModelProjector},
            labour_updates::{
                LabourUpdateReadModelProjector, LabourUpdateReadModelQuery,
                SqlLabourUpdateRepository,
            },
            subscription_status::{
                D1SubscriptionStatusRepository, SubscriptionStatusReadModelProjector,
            },
            subscription_token::{
                SqlSubscriptionTokenRepository, SubscriptionTokenProjector, SubscriptionTokenQuery,
            },
            subscriptions::{
                SqlSubscriptionRepository, SubscriptionQuery, SubscriptionReadModelProjector,
            },
            users::query::UserQuery,
        },
    },
    setup::config::Config,
    websocket::event_broadcaster::WebSocketEventBroadcaster,
    write_side::{
        application::{AdminCommandProcessor, CheckoutService, LabourCommandProcessor},
        domain::{Labour, LabourEvent},
        infrastructure::{RandomTokenGenerator, SqlCache, SqlEventStore, UserStore},
        process_manager::{EffectLedger, LabourEffectExecutor, ProcessManager},
    },
};

pub struct WriteModel {
    pub labour_command_processor: LabourCommandProcessor,
    pub admin_command_processor: AdminCommandProcessor,
    pub checkout_service: CheckoutService,
    pub user_store: UserStore,
}

pub struct ReadModel {
    pub aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
    pub event_query: EventQuery,
    pub user_query: UserQuery,
    pub labour_query: LabourReadModelQuery,
    pub contraction_query: ContractionReadModelQuery,
    pub labour_update_query: LabourUpdateReadModelQuery,
    pub subscription_query: SubscriptionQuery,
    pub subscription_token_query: SubscriptionTokenQuery,
}

pub struct AsyncProcessors {
    pub async_projection_processor: AsyncProjectionProcessor,
    pub sync_projection_processor: SyncProjectionProcessor,
    pub websocket_event_broadcaster: WebSocketEventBroadcaster,
}

pub struct ProcessManagement {
    pub process_manager: ProcessManager<LabourEffectExecutor>,
}

pub struct LabourRoomServices {
    write_model: WriteModel,
    read_model: ReadModel,
    async_processors: AsyncProcessors,
    process_management: ProcessManagement,
}

impl LabourRoomServices {
    fn build_write_model(
        state: &State,
        config: &Config,
        aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
    ) -> Result<WriteModel> {
        let sql = state.storage().sql();
        let labour_command_processor = LabourCommandProcessor::new(aggregate_repository.clone());

        let stripe_client = Box::new(WorkerStripeClient::new(config.stripe_secret_key.clone()));
        let checkout_service = CheckoutService::new(aggregate_repository, stripe_client);

        let checkpoint_repository = Box::new(SqlCheckpointRepository::create(sql.clone()));
        checkpoint_repository.init_schema()?;

        let admin_command_processor = AdminCommandProcessor::create(checkpoint_repository);

        let user_store = UserStore::create(sql);
        user_store
            .init_schema()
            .context("Failed to init user storage")?;

        Ok(WriteModel {
            labour_command_processor,
            admin_command_processor,
            checkout_service,
            user_store,
        })
    }

    fn build_read_model(
        state: &State,
        aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
    ) -> Result<ReadModel> {
        let sql = state.storage().sql();
        let event_query = EventQuery::new(aggregate_repository.clone());

        let labour_repository = Box::new(SqlLabourRepository::create(sql.clone()));
        let labour_query = LabourReadModelQuery::create(labour_repository);

        let contraction_repository = Box::new(SqlContractionRepository::create(sql.clone()));
        let contraction_query = ContractionReadModelQuery::create(contraction_repository);

        let labour_update_repository = Box::new(SqlLabourUpdateRepository::create(sql.clone()));
        let labour_update_query = LabourUpdateReadModelQuery::create(labour_update_repository);

        let subscription_repository = Box::new(SqlSubscriptionRepository::create(sql.clone()));
        let subscription_query = SubscriptionQuery::create(subscription_repository);

        let sub_token_repo = Box::new(SqlSubscriptionTokenRepository::create(sql.clone()));
        let subscription_token_query = SubscriptionTokenQuery::create(sub_token_repo);

        let user_storage = UserStore::create(sql);
        let user_query = UserQuery::new(user_storage);

        Ok(ReadModel {
            aggregate_repository,
            event_query,
            user_query,
            labour_query,
            contraction_query,
            labour_update_query,
            subscription_query,
            subscription_token_query,
        })
    }

    fn build_sync_projection_processor(
        state: &State,
        config: &Config,
        event_store: Rc<dyn EventStoreTrait>,
    ) -> Result<SyncProjectionProcessor> {
        let sql = state.storage().sql();

        let checkpoint_repository = Box::new(SqlCheckpointRepository::create(sql.clone()));
        checkpoint_repository.init_schema()?;

        let labour_repository = Box::new(SqlLabourRepository::create(sql.clone()));
        labour_repository.init_schema()?;

        let labour_projector = Box::new(LabourReadModelProjector::create(labour_repository));

        let contraction_repository = Box::new(SqlContractionRepository::create(sql.clone()));
        contraction_repository.init_schema()?;

        let contraction_projector = Box::new(ContractionReadModelProjector::create(
            contraction_repository,
        ));

        let labour_update_repository = Box::new(SqlLabourUpdateRepository::create(sql.clone()));
        labour_update_repository.init_schema()?;

        let labour_update_projector = Box::new(LabourUpdateReadModelProjector::create(
            labour_update_repository,
        ));

        let subscription_repository = Box::new(SqlSubscriptionRepository::create(sql.clone()));
        subscription_repository.init_schema()?;

        let subscription_projector = Box::new(SubscriptionReadModelProjector::create(
            subscription_repository,
        ));

        let sub_token_repo = Box::new(SqlSubscriptionTokenRepository::create(sql.clone()));
        sub_token_repo.init_schema()?;

        let subscription_token_projector =
            Box::new(SubscriptionTokenProjector::create(sub_token_repo));

        let projectors: Vec<Box<dyn SyncProjector<LabourEvent>>> = vec![
            labour_projector,
            contraction_projector,
            labour_update_projector,
            subscription_projector,
            subscription_token_projector,
        ];

        Ok(SyncProjectionProcessor::create(
            event_store,
            checkpoint_repository,
            projectors,
            config.default_batch_size,
        ))
    }

    fn build_async_projection_processor(
        env: &Env,
        config: &Config,
        event_store: Rc<dyn EventStoreTrait>,
        cache: Rc<dyn CacheTrait>,
    ) -> Result<AsyncProjectionProcessor> {
        let binding = "READ_MODEL_DB";

        let db = env
            .d1(binding)
            .context(format!("Failed to load {}", binding))?;
        let labour_repository = Box::new(D1LabourStatusRepository::create(db));
        let labour_status_projector = LabourStatusReadModelProjector::create(labour_repository);

        let db = env
            .d1(binding)
            .context(format!("Failed to load {}", binding))?;
        let subscription_repository = Box::new(D1SubscriptionStatusRepository::create(db));
        let subscription_status_projector =
            SubscriptionStatusReadModelProjector::create(subscription_repository);

        let projectors: Vec<Box<dyn IncrementalAsyncProjector<LabourEvent>>> = vec![
            Box::new(labour_status_projector),
            Box::new(subscription_status_projector),
        ];

        Ok(AsyncProjectionProcessor::create(
            event_store,
            cache,
            projectors,
            config.default_batch_size,
        ))
    }

    fn build_async_processors(
        state: &State,
        env: &Env,
        config: &Config,
        event_store: Rc<dyn EventStoreTrait>,
        cache: Rc<dyn CacheTrait>,
    ) -> Result<AsyncProcessors> {
        let websocket_event_broadcaster =
            WebSocketEventBroadcaster::create(event_store.clone(), config.default_batch_size);
        let async_projection_processor =
            Self::build_async_projection_processor(env, config, event_store.clone(), cache)?;
        let sync_projection_processor =
            Self::build_sync_projection_processor(state, config, event_store.clone())?;

        Ok(AsyncProcessors {
            async_projection_processor,
            sync_projection_processor,
            websocket_event_broadcaster,
        })
    }

    fn build_process_management(
        state: &State,
        env: &Env,
        config: &Config,
        event_store: Rc<dyn EventStoreTrait>,
        aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
        command_processor: Rc<LabourCommandProcessor>,
    ) -> Result<ProcessManagement> {
        let sql = state.storage().sql();

        let ledger = EffectLedger::create(sql.clone());
        ledger
            .init_schema()
            .context("Failed to initialize effect ledger schema")?;

        let notification_fetcher = env
            .service("NOTIFICATION_SERVICE_API")
            .context("Missing binding NOTIFICATION_SERVICE_API")?;

        let notification_client = Box::new(FetcherNotificationClient::create(
            notification_fetcher,
            config.notification_auth_token.clone(),
        ));

        let subscription_token_generator = Box::new(RandomTokenGenerator);

        let user_storage = UserStore::create(sql);

        let executor = LabourEffectExecutor::new(
            user_storage,
            notification_client,
            command_processor,
            subscription_token_generator,
            config.app_base_url.clone(),
        );

        let process_manager = ProcessManager::new(
            ledger,
            executor,
            event_store,
            aggregate_repository,
            config.default_batch_size,
            6,
        );

        Ok(ProcessManagement { process_manager })
    }

    const AGGREGATE_CACHE_KEY: &'static str = "aggregate:labour";

    pub fn from_worker_state(state: &State, env: &Env) -> Result<Self> {
        let config = Config::from_env(env)?;
        let sql = state.storage().sql();

        let event_store: Rc<dyn EventStoreTrait> = Rc::new(SqlEventStore::create(sql.clone()));
        event_store
            .init_schema()
            .context("Event store initialization failed")?;

        let cache = SqlCache::new(sql.clone());
        cache.init_schema().context("Cache initialization failed")?;
        let cache: Rc<dyn CacheTrait> = Rc::new(cache);

        let aggregate_repository = Rc::new(CachedAggregateRepository::new(
            event_store.clone(),
            cache.clone(),
            Self::AGGREGATE_CACHE_KEY.to_string(),
        ));

        let write_model = Self::build_write_model(state, &config, aggregate_repository.clone())?;

        let command_processor = Rc::new(write_model.labour_command_processor.clone());

        let read_model = Self::build_read_model(state, aggregate_repository.clone())?;
        let async_processors =
            Self::build_async_processors(state, env, &config, event_store.clone(), cache)?;
        let process_management = Self::build_process_management(
            state,
            env,
            &config,
            event_store.clone(),
            aggregate_repository.clone(),
            command_processor,
        )?;

        Ok(Self {
            write_model,
            read_model,
            async_processors,
            process_management,
        })
    }

    pub fn write_model(&self) -> &WriteModel {
        &self.write_model
    }

    pub fn read_model(&self) -> &ReadModel {
        &self.read_model
    }

    pub fn async_processors(&self) -> &AsyncProcessors {
        &self.async_processors
    }

    pub fn process_management(&self) -> &ProcessManagement {
        &self.process_management
    }
}
