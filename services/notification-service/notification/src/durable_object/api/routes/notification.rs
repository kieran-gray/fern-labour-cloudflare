use fern_labour_workers_shared::User;
use tracing::{error, info};
use worker::{Request, Response};

use crate::durable_object::api::{ApiResult, router::RequestContext};

pub async fn handle_notification_command(
    mut req: Request,
    ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    let command = match req.json().await {
        Ok(cmd) => cmd,
        Err(e) => {
            error!(error = ?e, "Failed to parse NotificationCommand");
            return Response::error("Failed to parse request body", 400);
        }
    };

    info!(user_id = %user.user_id, "Processing domain command");

    let result = ctx
        .data
        .write_model()
        .notification_command_processor
        .handle_command(command, user.user_id);

    if let Err(ref err) = result {
        error!(error = %err, "Command execution failed");
    } else {
        info!("Command executed successfully");
    }

    Ok(ApiResult::from_unit_result(result).into_response())
}
