use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::error;
use uuid::Uuid;
use worker::{Request, Response, RouteContext};

use crate::api_worker::AppState;

pub async fn handle_websocket_connect(
    req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let labour_id = match ctx.param("labour_id") {
        Some(id) => Uuid::parse_str(id).map_err(|_| format!("Invalid labour_id: {}", id))?,
        _ => {
            let error = "No labour_id provided in query";
            error!(user_id = %user.user_id, error);
            let response = Response::error(error.to_string(), 400)?;
            return Ok(cors_context.add_to_response(response));
        }
    };

    let upgrade_header = req.headers().get("Upgrade");

    match upgrade_header {
        Ok(Some(header)) if header == "websocket" => (),
        _ => return Ok(Response::empty()?.with_status(426))
    }

    let response = ctx
        .data
        .do_client
        .websocket_command(labour_id, &user, "/websocket")
        .await
        .map_err(|e| format!("Failed to send command to labour aggregate: {e}"))?;

    Ok(cors_context.add_to_response(response))
}
