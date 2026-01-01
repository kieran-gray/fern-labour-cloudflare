use serde_json::json;
use worker::{Request, Response, Result, RouteContext};

use crate::setup::app_state::AppState;

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
        None => {
            return Response::from_json(&json!({
                "error": "Unauthenticated"
            }))
            .map(|r| r.with_status(401));
        }
    };

    // No need to check internal auth token because this worker is only accessible through
    // service bindings.

    handler(req, ctx, service_id).await
}
