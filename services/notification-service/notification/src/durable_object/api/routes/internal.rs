use fern_labour_notifications_shared::InternalCommand;
use fern_labour_workers_shared::User;
use tracing::{error, info};
use worker::{Request, Response};

use crate::durable_object::{
    api::{ApiResult, router::RequestContext},
    write_side::domain::NotificationCommand,
};

pub async fn handle_internal_command(
    mut req: Request,
    ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    let internal_command: InternalCommand = match req.json().await {
        Ok(cmd) => cmd,
        Err(e) => {
            error!(error = ?e, "Failed to parse InternalCommand");
            return Response::error("Failed to parse request body", 400);
        }
    };

    info!(user_id = %user.user_id, "Processing internal command");

    let domain_command = NotificationCommand::from(internal_command);
    let result = ctx
        .data
        .write_model()
        .notification_command_processor
        .handle_command(domain_command, user.user_id);

    if let Err(ref err) = result {
        error!(error = %err, "Command execution failed");
    } else {
        info!("Command executed successfully");
    }

    Ok(ApiResult::from_unit_result(result).into_response())
}
