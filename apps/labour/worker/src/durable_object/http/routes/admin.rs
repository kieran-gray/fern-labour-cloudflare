use fern_labour_labour_shared::ApiCommand;
use fern_labour_workers_shared::User;
use tracing::{error, info};
use worker::{Request, Response};

use crate::durable_object::http::router::RequestContext;

pub async fn handle_admin_command(
    mut req: Request,
    ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    let api_command: ApiCommand = match req.json().await {
        Ok(cmd) => cmd,
        Err(e) => {
            error!(error = ?e, "Failed to parse ApiCommand");
            return Response::error("Failed to parse request body", 400);
        }
    };

    let admin_command = match api_command {
        ApiCommand::Admin(cmd) => cmd,
        _ => return Response::error("Invalid command type for admin endpoint", 400),
    };

    info!(
        aggregate_id = %admin_command.labour_id(),
        user_id = %user.user_id,
        auth_user_id = %user.user_id,
        "Processing admin command"
    );

    // Returning a response so we can control if the alarm handler runs based on
    // the command that was handled.
    // We need it to run for a rebuild, but definitely not for a deletion.
    ctx.data
        .write_model()
        .admin_command_processor
        .handle(admin_command)
        .await
        .map_err(|err| worker::Error::RustError(err.to_string()))
}
