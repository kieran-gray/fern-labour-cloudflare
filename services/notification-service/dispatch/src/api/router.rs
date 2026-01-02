use worker::Router;

use crate::api::middleware::internal_auth;
use crate::api::routes::dispatch_route::{dispatch, dispatch_async};
use crate::api::routes::webhooks::{
    handle_resend_webhook, handle_sendgrid_webhook, handle_twilio_webhook,
};
use crate::setup::app_state::AppState;

pub fn create_router(app_state: AppState) -> Router<'static, AppState> {
    Router::with_data(app_state)
        .post_async("/api/v1/dispatch-async", |req, ctx| {
            internal_auth(dispatch_async, req, ctx)
        })
        .post_async("/api/v1/dispatch", |req, ctx| {
            internal_auth(dispatch, req, ctx)
        })
        .post_async("/api/v1/webhook/twilio", handle_twilio_webhook)
        .post_async("/api/v1/webhook/sendgrid", handle_sendgrid_webhook)
        .post_async("/api/v1/webhook/resend", handle_resend_webhook)
}
