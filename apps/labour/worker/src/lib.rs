pub mod api_worker;
pub mod durable_object;

use fern_labour_labour_shared::{AdminCommand, ApiCommand};
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

        let pending_cleanup_ids = match app_state
            .labour_status_repository
            .get_pending_cleanup_ids()
            .await
        {
            Ok(ids) => ids,
            Err(err) => {
                error!(error = ?err, "Failed to fetch pending cleanup IDs");
                return;
            }
        };

        let admin_user = User::internal("scheduled");
        let labour_count = pending_cleanup_ids.len();

        for labour_id in pending_cleanup_ids {
            let command = ApiCommand::Admin(AdminCommand::DeleteDurableObject {
                aggregate_id: labour_id,
            });

            let Ok(_) = app_state
                .do_client
                .send_command(labour_id, command, &admin_user, "/admin/command")
                .await
            else {
                error!(labour_id = %labour_id, "Labour DO Delete command failed");
                continue;
            };

            if let Err(err) = app_state
                .labour_status_repository
                .mark_do_cleaned_up(labour_id)
                .await
            {
                error!(labour_id = %labour_id, err = %err, "Failed to mark labour DO as cleaned up");
            };
        }

        info!("Cleaned up Durable Objects for {labour_count} labours");
    }
    .instrument(info_span!("cron schedule", schedule = %controller.cron()))
    .await;
}
