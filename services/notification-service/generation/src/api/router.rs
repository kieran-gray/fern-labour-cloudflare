use worker::*;

use crate::api::middleware::internal_auth;
use crate::api::routes::render::{render, render_async};
use crate::setup::app_state::AppState;

pub fn create_router(app_state: AppState) -> Router<'static, AppState> {
    Router::with_data(app_state)
        .post_async("/api/v1/render-async", |req, ctx| {
            internal_auth(render_async, req, ctx)
        })
        .post_async("/api/v1/render", |req, ctx| internal_auth(render, req, ctx))
}
