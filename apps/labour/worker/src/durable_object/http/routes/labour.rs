use fern_labour_workers_shared::User;
use tracing::{error, info};
use worker::{Request, Response};

use crate::durable_object::{
    http::{ApiResult, router::RequestContext},
    write_side::domain::LabourCommand,
};

pub async fn handle_labour_domain_command(
    mut req: Request,
    ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    let Ok(command) = req.json::<LabourCommand>().await else {
        return Response::error("Failed to parse request body", 400);
    };

    info!(auth_user_id = %user.user_id, "Processing domain command");

    let result = ctx
        .data
        .write_model()
        .labour_command_processor
        .handle_command(command, user);

    if let Err(ref err) = result {
        error!(error = %err, "Domain command execution failed");
    } else {
        info!("Domain command executed successfully");
    }

    Ok(ApiResult::from_unit_result(result).into_response())
}
