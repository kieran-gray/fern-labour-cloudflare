use fern_labour_event_sourcing_rs::CommandEnvelope;
use fern_labour_labour_shared::commands::checkout::CheckoutCommand;
use fern_labour_workers_shared::User;
use tracing::{error, info};
use worker::{Request, Response};

use crate::durable_object::{http::ApiResult, http::router::RequestContext};

pub async fn handle_create_checkout_session(
    mut req: Request,
    ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    let Ok(envelope) = req.json::<CommandEnvelope<CheckoutCommand>>().await else {
        return Response::error("Failed to parse request body", 400);
    };

    let result = ctx
        .data
        .write_model()
        .checkout_service
        .create_checkout_session(envelope.command, user)
        .await;

    if let Err(ref err) = result {
        error!("Create checkout session failed: {}", err);
    } else {
        info!("Checkout session created successfully");
    }

    Ok(ApiResult::from_json_result(result).into_response())
}
