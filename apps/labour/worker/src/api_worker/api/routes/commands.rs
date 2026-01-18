use fern_labour_labour_shared::ApiCommand;
use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::error;
use worker::{Request, Response, RouteContext};

use crate::api_worker::{AppState, api::exceptions::ApiError};

pub async fn handle_command(
    mut req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let command: ApiCommand = match req.json().await {
        Ok(command) => command,
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to parse request body");
            let response = Response::from(ApiError::ValidationError(
                "Failed to parse request body".into(),
            ));
            return Ok(cors_context.add_to_response(response));
        }
    };

    let labour_id = command.labour_id();

    let (url, command_payload) = match &command {
        ApiCommand::Admin(cmd) => ("/admin/command", serde_json::to_value(cmd)?),
        _ => ("/api/command", serde_json::to_value(&command)?),
    };

    let mut do_response = ctx
        .data
        .do_client
        .send_command(labour_id, command_payload, &user, url)
        .await
        .map_err(|e| format!("Failed to send command to labour_aggregate: {e}"))?;

    let body = do_response.text().await?;
    let status = do_response.status_code();

    let new_response = if body.is_empty() {
        Response::empty()?
    } else {
        let mut response = Response::ok(body)?;
        let _ = response
            .headers_mut()
            .set("Content-Type", "application/json");
        response
    }
    .with_status(status);

    Ok(cors_context.add_to_response(new_response))
}
