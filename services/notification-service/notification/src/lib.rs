pub mod api_worker;
pub mod durable_object;
pub mod read_models;

use tracing::{Instrument, error, info, info_span};
use uuid::Uuid;

use serde_json::json;

use worker::{Context, Env, Request, Response, Result, event};

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
