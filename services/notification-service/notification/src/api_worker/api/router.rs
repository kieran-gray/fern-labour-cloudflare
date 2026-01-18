use worker::Router;

use crate::api_worker::AppState;
use crate::api_worker::api::middleware::authenticated;
use crate::api_worker::api::middleware::create_options_handler;
use crate::api_worker::api::routes::admin::{handle_admin_command, rebuild_notification_activity};
use crate::api_worker::api::routes::notification::handle_create_notification;
use crate::api_worker::api::routes::queries::get_notification_activity;
use crate::api_worker::api::routes::queries::{
    get_notification_detail, get_notification_events, get_notifications, get_notifications_detailed,
};
use crate::api_worker::api::routes::webhook::process_delivery_webhook;

pub fn create_router(app_state: AppState) -> Router<'static, AppState> {
    Router::with_data(app_state)
        .post_async("/api/v1/notification", |req, ctx| {
            authenticated(handle_create_notification, req, ctx)
        })
        .options("/api/v1/notification", create_options_handler)
        .get_async("/api/v1/notification/:notification_id", |req, ctx| {
            authenticated(get_notification_detail, req, ctx)
        })
        .get_async(
            "/api/v1/notification/events/:notification_id",
            |req, ctx| authenticated(get_notification_events, req, ctx),
        )
        .get_async("/api/v1/notifications", |req, ctx| {
            authenticated(get_notifications, req, ctx)
        })
        .get_async("/api/v1/notifications/detailed", |req, ctx| {
            authenticated(get_notifications_detailed, req, ctx)
        })
        .get_async("/api/v1/notifications/activity/:days", |req, ctx| {
            authenticated(get_notification_activity, req, ctx)
        })
        .post_async("/api/v1/admin/command", |req, ctx| {
            authenticated(handle_admin_command, req, ctx)
        })
        .options("/api/v1/admin/command", create_options_handler)
        .post_async("/api/v1/admin/rebuild-activity", |req, ctx| {
            authenticated(rebuild_notification_activity, req, ctx)
        })
        .options("/api/v1/admin/rebuild-activity", create_options_handler)
        .post_async("/api/v1/webhook/*provider", process_delivery_webhook)
}
