use fern_labour_notifications_shared::AdminCommand;
use fern_labour_workers_shared::User;
use tracing::info;
use worker::{Request, Response};

use crate::durable_object::api::router::RequestContext;

pub async fn handle_admin_command(
    mut req: Request,
    ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    let command: AdminCommand = match req.json().await {
        Ok(cmd) => cmd,
        Err(e) => {
            return Response::error(format!("Failed to parse request body: {}", e), 400);
        }
    };

    info!(user_id = %user.user_id, "Processing admin command");

    ctx.data
        .write_model()
        .admin_command_processor
        .handle_command(command)
        .await
        .map_err(|err| worker::Error::RustError(err.to_string()))
}
