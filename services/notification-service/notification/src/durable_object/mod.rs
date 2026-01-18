pub mod api;
pub mod exceptions;
pub mod read_side;
pub mod state;
pub mod write_side;

use tracing::{error, info};
use worker::{DurableObject, Env, Request, Response, Result, State, durable_object};

use crate::durable_object::{
    api::route_request, state::AggregateServices,
    write_side::infrastructure::alarm_manager::AlarmManager,
};

#[durable_object]
pub struct NotificationAggregate {
    state: State,
    env: Env,
    pub(crate) services: AggregateServices,
    alarm_manager: AlarmManager,
}

impl DurableObject for NotificationAggregate {
    fn new(state: State, env: Env) -> Self {
        let services = match AggregateServices::from_worker_state(&state) {
            Ok(s) => s,
            Err(err) => panic!("{}", err),
        };

        let alarm_manager = AlarmManager::create(state.storage());

        Self {
            state,
            env,
            services,
            alarm_manager,
        }
    }

    /*
    Fetch rules:
    - Ideally, only the lifecycle entrypoint should be asynchronous
    - Any functions that carry out business logic must be synchronous
      - SQL in DO's is synchronous, it runs in the same thread as the DO, so there should be
        no reason to run async code in any command/query handler.
      - If async work, like calling another service or adding to a queue, must be carried out,
        it should be scheduled and deferred to the alarm handler.
    - The DO is single threaded.
    - Input gates block incoming requests to the DO if storage operations are in progress.
    - Output gates block the outgoing response from being sent before all storage operations
      are confirmed to be persisted.

    Implications:
    - If two fetch requests hit the DO at the same time, they may both be able to deserialize
      the request DTO. However, the first fetch to hit the synchronous route_and_handle function
      will "win" and will complete all of the business logic.
    - When the second request tries to run route_and_handle, it will find that the command has
      already been handled.
     */
    async fn fetch(&self, req: Request) -> Result<Response> {
        let result = route_request(req, &self.services).await?;

        if result.status_code() == 204 {
            // As soon as we exit the durable object this alarm will be triggered and will process the
            // outbox in the background.
            // The latency between the end of the request and the alarm starting up is around 10ms with a
            // 0 delay alarm.
            self.alarm_manager
                .set_alarm(0)
                .await
                .map_err(|e| worker::Error::RustError(e.to_string()))?;
        }

        Ok(result)
    }

    /*
    Alarm rules:
    - Each DO can only have 1 alarm set at a time.
    - If a DO has an alarm set and we set it again, the original alarm is overwritten.
    - Only one instance of alarm() will ever run at a given time per durable object instance.
    - This alarm handler has guaranteed at-least-once execution and will be retried upon
      failure with exponential backoff.

    Implications:
    - We can use this alarm to carry out async tasks such as projecting events to read models
      and calling to external services (that may not be available).
    - We don't have to be as strict about race conditions as we know outbox processing cannot
      be in progress more than once at a time.
     */
    async fn alarm(&self) -> Result<Response> {
        info!("Alarm triggered - processing async operations");

        if let Err(err) = self.services.async_processors(&self.state, &self.env) {
            error!(error = %err, "Failed to initialize async processors");
            return Response::error(format!("Service initialization failed: {}", err), 500);
        }

        let services = self.services.get_async_processors();

        // These futures cannot be processed concurrently. We want to wait until all event processing
        // is completed before projecting.
        let process_manager_result = services.process_manager.on_alarm().await;
        if let Err(ref e) = process_manager_result {
            error!(error = %e, "Error in process manager alarm handling");
        }

        let projection_result = services.projection_processor.process_projections().await;
        if let Err(ref e) = projection_result {
            error!(error = %e, "Error in projection processing");
        }

        if process_manager_result.is_err() || projection_result.is_err() {
            return Err(worker::Error::RustError(
                "Error in alarm handling".to_string(),
            ));
        }

        Response::empty()
    }
}
