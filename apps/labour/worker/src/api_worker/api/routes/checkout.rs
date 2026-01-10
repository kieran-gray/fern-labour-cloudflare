use fern_labour_labour_shared::commands::checkout::CheckoutCommand;
use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::error;
use worker::{Request, Response, RouteContext};

use crate::api_worker::{AppState, api::exceptions::ApiError};

pub async fn handle_create_checkout_session(
    mut req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let command: CheckoutCommand = match req.json().await {
        Ok(c) => c,
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to parse checkout request");
            let response = Response::from(ApiError::ValidationError(
                "Failed to parse request body".into(),
            ));
            return Ok(cors_context.add_to_response(response));
        }
    };

    let labour_id = command.labour_id();

    let mut do_response = ctx
        .data
        .do_client
        .command(labour_id, command, &user, "/api/checkout")
        .await
        .map_err(|e| format!("Failed to create checkout session: {e}"))?;

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

pub async fn handle_stripe_webhook(
    req: Request,
    _ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let Ok(Some(signature_header)) = req.headers().get("stripe-signature") else {
        return Ok(Response::from(ApiError::ValidationError(
            "Failed to parse request body".into(),
        )));
    };

    // TODO: Implement webhook handling
    // 1. Verify Stripe signature
    // 2. Parse event
    // 3. For checkout.session.completed, send UpdateAccessLevel command to DO
    Response::error("Not implemented", 501)
}
