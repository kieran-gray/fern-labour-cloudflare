use worker::Router;

use crate::api::middleware::internal_auth;
use crate::api::routes::dispatch::dispatch;
use crate::api::routes::redact::redact;
use crate::api::routes::webhooks::{process_resend_webhook, process_twilio_webhook};
use crate::setup::app_state::AppState;

pub fn create_router(app_state: AppState) -> Router<'static, AppState> {
    Router::with_data(app_state)
        .post_async("/api/v1/dispatch", |req, ctx| {
            internal_auth(dispatch, req, ctx)
        })
        .post_async("/api/v1/redact", |req, ctx| internal_auth(redact, req, ctx))
        .post_async("/api/v1/webhook/twilio", process_twilio_webhook)
        .post_async("/api/v1/webhook/resend", process_resend_webhook)
}
