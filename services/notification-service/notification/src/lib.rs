pub mod api_worker;
pub mod durable_object;
pub mod read_models;

use anyhow::anyhow;
use fern_labour_workers_shared::clients::worker_clients::auth::User;
use tracing::{Instrument, debug, error, info, info_span};
use uuid::Uuid;

use serde_json::json;

use worker::{Context, Env, MessageBatch, MessageExt, Request, Response, Result, event};

use crate::{
    api_worker::{AppState, api::router::create_router, setup_observability},
    durable_object::write_side::domain::NotificationCommand,
};

use fern_labour_event_sourcing_rs::CommandEnvelope;
use fern_labour_notifications_shared::QueueMessage;

#[event(start)]
fn start() {
    setup_observability();
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let request_id = Uuid::now_v7();

    async move {
        info!(method = %req.method(), path = %req.path(), "START");
        let app_state = match AppState::from_env(&env) {
            Ok(app_state) => app_state,
            Err(err) => {
                error!(error = ?err, "Failed to create app state");
                let json = json!({"message": format!("Failed to create app state: {err}")});
                return Ok(Response::from_json(&json)?.with_status(500));
            }
        };

        let router = create_router(app_state);
        let result = router.run(req, env).await;

        match &result {
            Ok(res) => info!(status = res.status_code(), "SUCCESS"),
            Err(e) => error!(error = ?e, "FAILURE"),
        }

        result
    }
    .instrument(info_span!("request", request_id = %request_id))
    .await
}

#[event(queue)]
pub async fn main(message_batch: MessageBatch<String>, env: Env, _ctx: Context) -> Result<()> {
    let batch_id = Uuid::now_v7();

    async move {
        let app_state = match AppState::from_env(&env) {
            Ok(app_state) => app_state,
            Err(err) => {
                error!(error = ?err, "Failed to create app state");
                return Err(worker::Error::BindingError(err.to_string()));
            }
        };

        match message_batch.queue().as_str() {
            "fern-labour-notification-command-bus" => {
                for message in message_batch.messages()? {
                    let envelope: CommandEnvelope<QueueMessage> =
                        match serde_json::from_str(message.body()) {
                            Ok(env) => env,
                            Err(e) => {
                                error!(error = %e, "Failed to deserialize command");
                                message.retry();
                                continue;
                            }
                        };

                    info!(aggregate_id = %envelope.metadata.aggregate_id, "Processing command from queue");
                    let user = User::internal(&envelope.metadata.user_id);
                    let response = match envelope.command {
                        QueueMessage::Internal(cmd) => {
                            let internal_envelope = CommandEnvelope {
                                command: cmd,
                                metadata: envelope.metadata,
                            };
                            app_state
                                .do_client
                                .send_envelope(
                                    internal_envelope.metadata.aggregate_id,
                                    "/notification/command",
                                    internal_envelope,
                                    &user
                                )
                                .await
                                .map_err(|e| anyhow!("Notification DO Error: {e}"))
                        }
                        QueueMessage::Admin(cmd) => {
                            let admin_envelope = CommandEnvelope {
                                command: cmd,
                                metadata: envelope.metadata,
                            };
                            app_state
                                .do_client
                                .send_envelope(
                                    admin_envelope.metadata.aggregate_id,
                                    "/admin/command",
                                    admin_envelope,
                                    &user
                                )
                                .await
                                .map_err(|e| anyhow!("Notification DO Error: {e}"))
                        }
                        QueueMessage::Public(cmd) => {
                            let notification_id = Uuid::now_v7();
                            let domain_command = match NotificationCommand::try_from((cmd, notification_id)) {
                                Ok(command) => command,
                                Err(err) => {
                                    error!(error = ?err, "Failed to convert PublicCommand to NotificationCommand");
                                    message.retry();
                                    continue;
                                }
                            };
                            let domain_envelope = CommandEnvelope {
                                command: domain_command,
                                metadata: envelope.metadata,
                            };
                            app_state
                                .do_client
                                .send_envelope(
                                    domain_envelope.metadata.aggregate_id,
                                    "/notification/domain",
                                    domain_envelope,
                                    &user
                                )
                                .await
                                .map_err(|e| anyhow!("Notification DO Error: {e}"))
                        },
                        _ => Ok(Response::empty().unwrap().with_status(204))
                    };
                    match response
                    {
                        Ok(response) => {
                            if response.status_code() < 300 {
                                debug!("Command handled successfully");
                                message.ack();
                            } else {
                                let error =
                                    format!("Client returned error status: {}", response.status_code());
                                error!(error);
                                message.retry();
                            }
                        }
                        Err(e) => {
                            let error = format!("Failed to send command client: {e:?}");
                            error!(error);
                            message.retry();
                        }
                    }
                }
            }
            queue => error!("Received event batch for unknown queue: {queue}"),
        }
        Ok(())
    }
    .instrument(info_span!("message batch", batch_id = %batch_id))
    .await
}
