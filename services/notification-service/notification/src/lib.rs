pub mod api_worker;
pub mod durable_object;

use fern_labour_notifications_shared::AdminCommand;
use fern_labour_workers_shared::User;
use tracing::{Instrument, error, info, info_span};
use uuid::Uuid;

use serde_json::json;

use worker::{Context, Env, Request, Response, Result, ScheduleContext, ScheduledEvent, event};

use crate::api_worker::{AppState, api::router::create_router, setup_observability};

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

#[event(scheduled)]
async fn scheduled(controller: ScheduledEvent, env: Env, _ctx: ScheduleContext) {
    async move {
        let app_state = match AppState::from_env(&env) {
            Ok(app_state) => app_state,
            Err(err) => {
                error!(error = ?err, "Failed to create app state");
                return;
            }
        };
        let deleted_notification_ids =
            match app_state.notification_detail_repository.get_deleted_ids().await {
                Ok(ids) => ids,
                Err(err) => {
                    error!(error = ?err, "Failed to fetch deleted notification IDs");
                    return;
                }
            };
        let admin_user = User::internal("fern-labour-notifications-admin");

        let notification_count = deleted_notification_ids.len();
        for notification_id in deleted_notification_ids {
            let Ok(_) = app_state
                .do_client
                .send_command(
                    notification_id,
                    AdminCommand::DeleteDurableObject {
                        aggregate_id: notification_id,
                    },
                    &admin_user,
                    "/admin/command",
                )
                .await
            else {
                error!(notification_id = %notification_id, "Notification DO Delete command failed");
                continue;
            };
            if let Err(err) = app_state.notification_detail_repository.delete(notification_id).await {
                error!(notification_id = %notification_id, err = %err, "Failed to delete notification detail row");
            };
        }

        info!("Deleted all data for {notification_count} notifications");
    }
    .instrument(info_span!("cron schedule", schedule = %controller.cron()))
    .await;
}
