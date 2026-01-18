use fern_labour_notifications_shared::AdminCommand;
use fern_labour_workers_shared::User;
use tracing::info;
use worker::{Request, Response};

use crate::durable_object::api::{ApiResult, router::RequestContext};

pub async fn handle_admin_command(
    mut req: Request,
    _ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    let command: AdminCommand = match req.json().await {
        Ok(cmd) => cmd,
        Err(e) => {
            return Response::error(format!("Failed to parse request body: {}", e), 400);
        }
    };

    info!(user_id = %user.user_id, "Processing admin command");

    let result = handle_admin(command);

    Ok(ApiResult::from_unit_result(result).into_response())
}

fn handle_admin(command: AdminCommand) -> anyhow::Result<()> {
    match command {
        AdminCommand::RebuildReadModels { aggregate_id } => {
            info!(aggregate_id = %aggregate_id, "Rebuilding read models");
            Ok(())
        }
    }
}
