use fern_labour_notifications_shared::service_clients::dispatch::{
    requests::RedactRequest, responses::RedactResponse,
};
use tracing::{error, info};
use worker::{Request, Response, RouteContext};

use crate::setup::app_state::AppState;

pub async fn redact(
    mut req: Request,
    ctx: RouteContext<AppState>,
    service_id: String,
) -> worker::Result<Response> {
    let redact_request: RedactRequest = match req.json().await {
        Ok(r) => r,
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to parse redact request");
            return Response::error("Failed to parse redact request", 400);
        }
    };

    match ctx
        .data
        .notification_router
        .redact(redact_request.provider, redact_request.external_id)
        .await
    {
        Ok(redacted) => {
            info!("Notification redacted successfully");
            let response = RedactResponse { redacted };
            Response::from_json(&response)
        }
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to redact notification");
            Response::error(format!("Failed to redact notification: {e}"), 500)
        }
    }
}
