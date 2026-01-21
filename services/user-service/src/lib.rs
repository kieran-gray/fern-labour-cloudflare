pub mod api;
pub mod infrastructure;
pub mod setup;

use tracing::{Instrument, error, info, info_span};

use uuid::Uuid;
use worker::*;

use crate::{
    api::router::create_router,
    setup::{app_state::AppState, observability::setup_observability},
};

#[event(start)]
fn start() {
    setup_observability();
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let request_id = Uuid::now_v7();

    async move {
        info!(method = %req.method(), path = %req.path(), "START");
        let app_state = AppState::from_env(&env)
            .map_err(|e| worker::Error::RustError(format!("Failed to build app state: {e}")))?;
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
