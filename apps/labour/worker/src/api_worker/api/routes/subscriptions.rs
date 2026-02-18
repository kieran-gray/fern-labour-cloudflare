use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::info;
use worker::{Request, Response, RouteContext};

use crate::api_worker::{
    AppState,
    api::utils::{build_paginated_response, decode_paginated_query},
};

pub async fn get_user_subscriptions(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let subscription_status = ctx
        .data
        .subscription_status_repository
        .get_by_user_id(user.user_id, 100, None)
        .await
        .map_err(|e| format!("Failed to query subscription status: {e}"))?;

    let response = Response::from_json(&subscription_status)
        .map_err(|e| format!("Failed to serialize response: {e}"))?;

    Ok(cors_context.add_to_response(response))
}

pub async fn get_subscribed_labours(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let subscriptions = ctx
        .data
        .subscription_status_repository
        .get_by_user_id(user.user_id, 100, None)
        .await
        .map_err(|e| format!("Failed to query subscription status: {e}"))?;

    let labour_ids: Vec<_> = subscriptions.iter().map(|s| s.labour_id).collect();

    let labours = ctx
        .data
        .labour_status_repository
        .get_by_ids(labour_ids)
        .await
        .map_err(|e| format!("Failed to query labour status: {e}"))?;

    let response =
        Response::from_json(&labours).map_err(|e| format!("Failed to serialize response: {e}"))?;

    Ok(cors_context.add_to_response(response))
}

pub async fn get_subscriptions(
    req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    info!(user_id = %user.user_id, "List subscriptions request");

    let (limit, decoded_cursor) = decode_paginated_query(&req)
        .map_err(|_| worker::Error::RustError("Invalid query params".into()))?;

    let subscriptions = ctx
        .data
        .subscription_status_repository
        .get(limit, decoded_cursor)
        .await
        .map_err(|e| format!("Failed to query subscriptions: {e}"))?;

    let response_body = build_paginated_response(subscriptions, limit);
    let response = Response::from_json(&response_body)
        .map_err(|e| format!("Failed to serialize response: {e}"))?;
    Ok(cors_context.add_to_response(response))
}
