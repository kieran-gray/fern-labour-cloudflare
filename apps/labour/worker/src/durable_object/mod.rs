pub mod authorization;
pub mod exceptions;
pub mod http;
pub mod read_side;
pub mod setup;
pub mod websocket;
pub mod write_side;

use chrono::Utc;
use fern_labour_workers_shared::User;
use serde_json::json;
use tracing::{error, info};
use worker::{
    DurableObject, Env, Request, Response, Result, State, WebSocket, WebSocketIncomingMessage,
    durable_object,
};

use crate::durable_object::{
    http::router::route_request,
    read_side::query_handler::QueryHandler,
    setup::state::LabourRoomServices,
    websocket::{
        middleware::extract_auth_context_from_websocket,
        routes::upgrade_connection,
        schemas::{WebSocketRequest, parse_websocket_message},
    },
    write_side::{
        command_translator::CommandTranslator, infrastructure::alarm_manager::AlarmManager,
    },
};

#[durable_object]
pub struct LabourRoom {
    state: State,
    _env: Env,
    pub(crate) services: LabourRoomServices,
    alarm_manager: AlarmManager,
}

impl DurableObject for LabourRoom {
    fn new(state: State, env: Env) -> Self {
        let services = match LabourRoomServices::from_worker_state(&state, &env) {
            Ok(s) => s,
            Err(err) => panic!("{}", err),
        };

        let alarm_manager = AlarmManager::create(state.storage());

        Self {
            state,
            _env: env,
            services,
            alarm_manager,
        }
    }

    async fn fetch(&self, req: Request) -> Result<Response> {
        if req.path() == "/websocket" {
            return upgrade_connection(req, &self.state).await;
        }

        let result = route_request(req, &self.services).await?;

        if result.status_code() == 204 {
            self.alarm_manager
                .set_alarm(0)
                .await
                .map_err(|e| worker::Error::RustError(e.to_string()))?;
        }

        Ok(result)
    }

    async fn websocket_message(
        &self,
        ws: WebSocket,
        message: WebSocketIncomingMessage,
    ) -> Result<()> {
        let msg = parse_websocket_message(message)?;
        let user: User = extract_auth_context_from_websocket(&ws)?;

        info!(user_id = %user.user_id, "Processing message from WebSocket");
        let (success, data, error) = match msg.request {
            WebSocketRequest::Command { command } => {
                match CommandTranslator::translate(command, &user) {
                    Ok(domain_command) => {
                        let result = self
                            .services
                            .write_model()
                            .labour_command_processor
                            .handle_command(domain_command, user);

                        match result {
                            Ok(()) => {
                                self.alarm_manager.set_alarm(0).await.ok();
                                (true, None, None)
                            }
                            Err(e) => (false, None, Some(e.to_string())),
                        }
                    }
                    Err(e) => (false, None, Some(e.to_string())),
                }
            }
            WebSocketRequest::Query { query } => {
                let handler = QueryHandler::new(self.services.read_model());
                match handler.handle(query, &user) {
                    Ok(data) => (true, Some(data), None),
                    Err(e) => (false, None, Some(e.to_string())),
                }
            }
            WebSocketRequest::ServerTimestamp => {
                (true, Some(json!({"server_timestamp": Utc::now()})), None)
            }
        };

        let response = serde_json::json!({
            "correlation_id": msg.correlation_id,
            "success": success,
            "data": data,
            "error": error,
        });

        ws.send_with_str(response.to_string()).ok();
        Ok(())
    }

    async fn websocket_close(
        &self,
        _ws: WebSocket,
        _code: usize,
        _reason: String,
        _was_clean: bool,
    ) -> Result<()> {
        info!("Client disconnected");
        Ok(())
    }

    async fn alarm(&self) -> Result<Response> {
        info!("Alarm triggered");
        let alarm_services = self.services.async_processors();

        let sequence_before = alarm_services
            .sync_projection_processor
            .get_last_processed_sequence();

        let sync_result = alarm_services
            .sync_projection_processor
            .process_projections();

        if let Err(ref e) = sync_result {
            error!(error = %e, "Error in sync projection processing");
        } else {
            let sequence_after = alarm_services
                .sync_projection_processor
                .get_last_processed_sequence();

            if sequence_after > sequence_before
                && let Err(e) = alarm_services
                    .websocket_event_broadcaster
                    .broadcast_new_events(&self.state, sequence_before)
            {
                error!(error = %e, "Failed to broadcast events to WebSocket clients");
            }
        }

        let async_result = alarm_services
            .async_projection_processor
            .process_projections()
            .await;

        if let Err(ref e) = async_result {
            error!(error = %e, "Error in async processing");
        }

        let process_mgmt = self.services.process_management();
        let process_manager_result = process_mgmt.process_manager.on_alarm().await;
        if let Err(ref e) = process_manager_result {
            error!(error = %e, "Error in process manager alarm handling");
        }

        if sync_result.is_err() || async_result.is_err() || process_manager_result.is_err() {
            return Err(worker::Error::RustError(
                "Error in alarm handling".to_string(),
            ));
        }

        if alarm_services
            .sync_projection_processor
            .has_unprocessed_events()
        {
            info!("Scheduling follow-up alarm to process events generated by process manager");
            self.alarm_manager
                .set_alarm(0)
                .await
                .map_err(|e| worker::Error::RustError(e.to_string()))?;
        }

        Response::empty()
    }
}
