pub mod infrastructure;
pub mod setup;

use fern_labour_notifications_shared::service_clients::{RenderRequest, RenderResponse};
use tracing::{Instrument, error, info, info_span};

use uuid::Uuid;
use worker::*;

use crate::{
    infrastructure::template_engine::TinyTemplateEngine, setup::observability::setup_observability,
};

#[derive(Default)]
pub struct AppState {
    pub template_engine: TinyTemplateEngine,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            template_engine: TinyTemplateEngine::new(),
        }
    }
}

#[event(start)]
fn start() {
    setup_observability();
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let request_id = Uuid::now_v7();

    async move {
        info!(method = %req.method(), path = %req.path(), "START");
        let app_state = AppState::new();
        let router = Router::with_data(app_state).post_async("/api/v1/render", render);

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

pub async fn render(mut req: Request, ctx: RouteContext<AppState>) -> worker::Result<Response> {
    let request: RenderRequest = match req.json().await {
        Ok(r) => r,
        Err(e) => {
            error!(error = ?e, "Failed to parse render request");
            return Response::error("Failed to parse render request", 400);
        }
    };

    info!(channel = %request.channel, "Rendering notification template");

    match ctx
        .data
        .template_engine
        .render_content(request.channel, request.template_data)
    {
        Ok(rendered_content) => {
            info!("Template rendered successfully");
            Response::from_json(&RenderResponse { rendered_content })
        }
        Err(e) => {
            error!(error = ?e, "Failed to render template");
            Response::error(format!("Failed to render template: {e}"), 500)
        }
    }
}
