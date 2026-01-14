use fern_labour_notifications_shared::service_clients::{RenderRequest, RenderResponse};
use tracing::{error, info};
use worker::{Request, Response, RouteContext};

use crate::setup::app_state::AppState;

pub async fn render(
    mut req: Request,
    ctx: RouteContext<AppState>,
    service_id: String,
) -> worker::Result<Response> {
    let request: RenderRequest = match req.json().await {
        Ok(r) => r,
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to parse render request");
            return Response::error("Failed to parse render request", 400);
        }
    };

    info!(
        service_id = %service_id,
        channel = %request.channel,
        "Rendering notification template"
    );

    match ctx
        .data
        .template_engine
        .render_content(request.channel, request.template_data)
    {
        Ok(rendered_content) => {
            info!(service_id = %service_id, "Template rendered successfully");
            Response::from_json(&RenderResponse { rendered_content })
        }
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to render template");
            Response::error(format!("Failed to render template: {e}"), 500)
        }
    }
}
