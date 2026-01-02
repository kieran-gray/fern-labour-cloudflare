use serde_json::json;
use worker::{Request, Response, Result, RouteContext};

use crate::setup::app_state::AppState;

fn unauthenticated_response() -> Result<Response> {
    Response::from_json(&json!({
        "error": "Unauthenticated"
    }))
    .map(|r| r.with_status(401))
}

pub async fn internal_auth<F, Fut>(
    handler: F,
    req: Request,
    ctx: RouteContext<AppState>,
) -> Result<Response>
where
    F: Fn(Request, RouteContext<AppState>, String) -> Fut,
    Fut: std::future::Future<Output = Result<Response>>,
{
    let service_id = match req.headers().get("X-Service-ID").ok().flatten() {
        Some(service_header) => service_header,
        None => return unauthenticated_response(),
    };

    let token = match req.headers().get("X-Internal-Auth").ok().flatten() {
        Some(service_header) => service_header,
        None => return unauthenticated_response(),
    };

    if token != ctx.data.internal_service_token {
        return unauthenticated_response();
    }

    handler(req, ctx, service_id).await
}
