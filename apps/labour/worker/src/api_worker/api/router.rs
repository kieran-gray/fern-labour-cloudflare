use worker::Router;

use crate::api_worker::AppState;
use crate::api_worker::api::middleware::authenticated;
use crate::api_worker::api::middleware::create_options_handler;
use crate::api_worker::api::middleware::websocket_authenticated;
use crate::api_worker::api::routes::commands::handle_command;
use crate::api_worker::api::routes::labour::get_active_labour;
use crate::api_worker::api::routes::labour::get_labour_history;
use crate::api_worker::api::routes::labour::handle_plan_labour;
use crate::api_worker::api::routes::queries::get_server_timestamp;
use crate::api_worker::api::routes::queries::handle_query;
use crate::api_worker::api::routes::subscriptions::get_subscribed_labours;
use crate::api_worker::api::routes::subscriptions::get_user_subscriptions;
use crate::api_worker::api::routes::websocket::handle_websocket_connect;

pub fn create_router(app_state: AppState) -> Router<'static, AppState> {
    Router::with_data(app_state)
        .post_async("/api/v1/labour/plan", |req, ctx| {
            authenticated(handle_plan_labour, req, ctx)
        })
        .options("/api/v1/labour/plan", create_options_handler)
        .get_async("/api/v1/labour/history", |req, ctx| {
            authenticated(get_labour_history, req, ctx)
        })
        .options("/api/v1/labour/history", create_options_handler)
        .get_async("/api/v1/labour/active", |req, ctx| {
            authenticated(get_active_labour, req, ctx)
        })
        .options("/api/v1/labour/active", create_options_handler)
        .get_async("/api/v1/subscriptions/list", |req, ctx| {
            authenticated(get_user_subscriptions, req, ctx)
        })
        .options("/api/v1/subscriptions/list", create_options_handler)
        .get_async("/api/v1/subscriptions/labours", |req, ctx| {
            authenticated(get_subscribed_labours, req, ctx)
        })
        .options("/api/v1/subscriptions/labours", create_options_handler)
        .post_async("/api/v1/command", |req, ctx| {
            authenticated(handle_command, req, ctx)
        })
        .options("/api/v1/command", create_options_handler)
        .post_async("/api/v1/query", |req, ctx| {
            authenticated(handle_query, req, ctx)
        })
        .get_async("/api/v1/timestamp/:labour_id",|req, ctx| {
            authenticated(get_server_timestamp, req, ctx)
        })
        .options("/api/v1/timestamp/:labour_id", create_options_handler)
        .on_async("/api/v1/connect/:labour_id", |req, ctx| {
            websocket_authenticated(handle_websocket_connect, req, ctx)
        })
        .options("/api/v1/query", create_options_handler)
}
