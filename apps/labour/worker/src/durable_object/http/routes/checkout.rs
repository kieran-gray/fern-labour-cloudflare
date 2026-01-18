use fern_labour_labour_shared::ApiCommand;
use fern_labour_workers_shared::User;
use tracing::{error, info};
use worker::{Request, Response};

use crate::durable_object::http::router::RequestContext;

pub async fn handle_create_checkout_session(
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

    let checkout_command = match api_command {
        ApiCommand::Checkout(cmd) => cmd,
        _ => return Response::error("Invalid command type for checkout endpoint", 400),
    };

    let result = ctx
        .data
        .write_model()
        .checkout_service
        .create_checkout_session(checkout_command, user)
        .await;

    match result {
        Ok(data) => {
            info!("Checkout session created successfully");
            Response::from_json(&data)
        }
        Err(err) => {
            error!("Create checkout session failed: {}", err);
            Response::error(err.to_string(), 400)
        }
    }
}
