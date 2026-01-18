use anyhow::Result;
use base64::{Engine, prelude::BASE64_URL_SAFE_NO_PAD};
use chrono::{DateTime, Utc};
use fern_labour_event_sourcing_rs::{Cursor, DecodedCursor, PaginatedQuery, PaginatedResponse};
use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::error;
use uuid::Uuid;
use worker::{Request, Response, RouteContext};

use crate::api_worker::{AppState, api::exceptions::ApiError};

pub async fn get_notifications_detailed(
    req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let app_state = ctx.data;
    let (limit, decoded_cursor) = decode_paginated_query(&req)
        .map_err(|_| worker::Error::RustError("Invalid query params".into()))?;

    match app_state
        .notification_detail_query
        .get_notifications(limit, decoded_cursor)
        .await
    {
        Ok(notifications) => {
            let response_body = build_paginated_response(notifications, limit);
            let response = Response::from_json(&response_body)?;
            Ok(cors_context.add_to_response(response))
        }
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to query notifications");
            let response = Response::from(ApiError::InternalServerError(
                "Failed to retrieve notifications".into(),
            ));
            Ok(cors_context.add_to_response(response))
        }
    }
}

pub async fn get_notification_detail(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let notification_id = match ctx.param("notification_id") {
        Some(id) => Uuid::parse_str(id).map_err(|_| format!("Invalid notification_id: {}", id))?,
        _ => {
            let error = "No notification_id provided in query";
            error!(user_id = %user.user_id, error);
            let response = Response::from(ApiError::ValidationError(error.to_string()));
            return Ok(cors_context.add_to_response(response));
        }
    };

    match ctx
        .data
        .notification_detail_query
        .get_notification(&notification_id)
        .await
    {
        Ok(notifications) => {
            let response = Response::from_json(&notifications)?;
            Ok(cors_context.add_to_response(response))
        }
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to query user notifications");
            let response = Response::from(ApiError::InternalServerError(
                "Failed to retrieve notifications".into(),
            ));
            Ok(cors_context.add_to_response(response))
        }
    }
}

pub async fn get_notifications(
    req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let app_state = ctx.data;
    let (limit, decoded_cursor) = decode_paginated_query(&req)
        .map_err(|_| worker::Error::RustError("Invalid query params".into()))?;

    match app_state
        .notification_status_query
        .get_notifications(limit, decoded_cursor)
        .await
    {
        Ok(notifications) => {
            let response_body = build_paginated_response(notifications, limit);
            let response = Response::from_json(&response_body)?;
            Ok(cors_context.add_to_response(response))
        }
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to query notifications");
            let response = Response::from(ApiError::InternalServerError(
                "Failed to retrieve notifications".into(),
            ));
            Ok(cors_context.add_to_response(response))
        }
    }
}

pub async fn get_notification_events(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let notification_id = match ctx.param("notification_id") {
        Some(id) => Uuid::parse_str(id).map_err(|_| format!("Invalid notification_id: {}", id))?,
        _ => {
            let error = "No notification_id provided in query";
            error!(user_id = %user.user_id, error);
            let response = Response::from(ApiError::ValidationError(error.to_string()));
            return Ok(cors_context.add_to_response(response));
        }
    };

    match ctx
        .data
        .do_client
        .send_query(notification_id, "/notification/events", &user)
        .await
    {
        Ok(response) => Ok(cors_context.add_to_response(response)),
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to query notification events");
            let response = Response::from(ApiError::InternalServerError(
                "Failed to retrieve notification events".into(),
            ));
            Ok(cors_context.add_to_response(response))
        }
    }
}

pub async fn get_notification_activity(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let days: usize = match ctx.param("days") {
        Some(id) => id
            .parse()
            .map_err(|_| format!("Invalid days param: {}", id))?,
        _ => {
            let error = "No days param provided in query";
            error!(user_id = %user.user_id, error);
            let response = Response::from(ApiError::ValidationError(error.to_string()));
            return Ok(cors_context.add_to_response(response));
        }
    };

    match ctx
        .data
        .notification_activity_query
        .get_activity_for_days(days)
        .await
    {
        Ok(notification_activity) => {
            let response = Response::from_json(&notification_activity)?;
            Ok(cors_context.add_to_response(response))
        }
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to query notification activity");
            let response = Response::from(ApiError::InternalServerError(
                "Failed to retrieve notification activity".into(),
            ));
            Ok(cors_context.add_to_response(response))
        }
    }
}

fn decode_paginated_query(req: &Request) -> Result<(usize, Option<DecodedCursor>)> {
    let url = req.url()?;
    let query: PaginatedQuery = serde_qs::from_str(url.query().unwrap_or(""))?;

    let limit = query.limit.unwrap_or(20).min(100);

    let decoded_cursor = query.cursor.and_then(|c_str| {
        let decoded = BASE64_URL_SAFE_NO_PAD.decode(c_str).ok()?;
        let s = String::from_utf8(decoded).ok()?;
        let mut parts = s.split('|');

        let timestamp = parts.next()?;
        let uuid = parts.next()?;

        if parts.next().is_some() {
            return None;
        }

        let last_updated_at = DateTime::parse_from_rfc3339(timestamp)
            .ok()
            .map(|dt| dt.with_timezone(&Utc))?;

        let last_id = Uuid::parse_str(uuid).ok()?;

        Some(DecodedCursor {
            last_updated_at,
            last_id,
        })
    });
    Ok((limit, decoded_cursor))
}

fn build_paginated_response<T: Cursor>(mut items: Vec<T>, limit: usize) -> PaginatedResponse<T> {
    let has_more = items.len() > limit;
    if has_more {
        items.pop();
    }

    let next_cursor = has_more.then(|| items.last()).flatten().map(|last_item| {
        let cursor_str = format!("{}|{}", last_item.updated_at().to_rfc3339(), last_item.id());
        BASE64_URL_SAFE_NO_PAD.encode(cursor_str)
    });

    PaginatedResponse {
        data: items,
        next_cursor,
        has_more,
    }
}
