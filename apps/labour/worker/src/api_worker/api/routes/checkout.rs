use fern_labour_labour_shared::{
    ApiCommand, SubscriberCommand, commands::checkout::CheckoutCommand,
    value_objects::SubscriberAccessLevel,
};
use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::{error, info, warn};
use worker::{Request, Response, RouteContext};

use crate::api_worker::{
    AppState,
    api::exceptions::ApiError,
    infrastructure::stripe_webhook::{
        CheckoutCompleted, StripeEvent, StripeWebhookVerifier, WebhookError,
    },
};

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
    mut req: Request,
    ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let Ok(Some(signature)) = req.headers().get("stripe-signature") else {
        warn!("Missing stripe-signature header");
        return Response::error("Missing signature", 400);
    };

    let payload = match req.text().await {
        Ok(p) => p,
        Err(e) => {
            error!(error = ?e, "Failed to read webhook payload");
            return Response::error("Failed to read body", 400);
        }
    };

    let verifier = StripeWebhookVerifier::new(ctx.data.config.stripe_webhook_secret.clone());

    let event = match verifier.verify_and_parse(&payload, &signature) {
        Ok(event) => event,
        Err(e) => return webhook_error_response(e),
    };

    match event {
        StripeEvent::CheckoutSessionCompleted(checkout) => {
            handle_checkout_completed(checkout, &ctx).await
        }
        StripeEvent::CheckoutSessionUnpaid { session_id } => {
            info!(session_id = %session_id, "Checkout session not paid, skipping");
            Response::ok("OK")
        }
        StripeEvent::Ignored { event_type } => {
            info!(event_type = %event_type, "Ignoring Stripe event");
            Response::ok("OK")
        }
    }
}

async fn handle_checkout_completed(
    checkout: CheckoutCompleted,
    ctx: &RouteContext<AppState>,
) -> worker::Result<Response> {
    info!(
        session_id = %checkout.session_id,
        labour_id = %checkout.labour_id,
        subscription_id = %checkout.subscription_id,
        "Processing checkout.session.completed"
    );

    let command = ApiCommand::Subscriber(SubscriberCommand::UpdateAccessLevel {
        labour_id: checkout.labour_id,
        subscription_id: checkout.subscription_id,
        access_level: SubscriberAccessLevel::SUPPORTER,
    });

    let internal_user = User::internal("fern-labour-stripe-webhook");

    let result = ctx
        .data
        .do_client
        .send_raw_command(checkout.labour_id, command, &internal_user, "/api/command")
        .await;

    match result {
        Ok(response) if response.status_code() < 300 => {
            info!(
                labour_id = %checkout.labour_id,
                subscription_id = %checkout.subscription_id,
                "Successfully upgraded subscription to SUPPORTER"
            );
            Response::ok("OK")
        }
        Ok(response) => {
            error!(
                labour_id = %checkout.labour_id,
                subscription_id = %checkout.subscription_id,
                status = response.status_code(),
                "DO returned error for UpdateAccessLevel"
            );
            Response::error("Failed to update access level", 500)
        }
        Err(e) => {
            error!(
                labour_id = %checkout.labour_id,
                subscription_id = %checkout.subscription_id,
                error = ?e,
                "Failed to send UpdateAccessLevel command"
            );
            Response::error("Internal error", 500)
        }
    }
}

fn webhook_error_response(error: WebhookError) -> worker::Result<Response> {
    match &error {
        WebhookError::MissingTimestamp
        | WebhookError::InvalidTimestamp
        | WebhookError::MissingSignature => {
            warn!(error = %error, "Invalid webhook signature header");
            Response::error("Invalid signature", 400)
        }
        WebhookError::TimestampOutOfRange { timestamp, now } => {
            warn!(
                timestamp = timestamp,
                now = now,
                "Webhook timestamp outside tolerance"
            );
            Response::error("Invalid signature", 401)
        }
        WebhookError::InvalidSignature => {
            warn!("Invalid Stripe webhook signature");
            Response::error("Invalid signature", 401)
        }
        WebhookError::PayloadParseError(msg) => {
            error!(error = %msg, "Failed to parse Stripe webhook payload");
            Response::error("Invalid payload", 400)
        }
    }
}
