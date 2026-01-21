use fern_labour_workers_shared::clients::worker_clients::auth::User;
use worker::{Request, Response, Result};

use crate::durable_object::http::router::RequestContext;

pub async fn with_auth_context<'a, F, Fut>(
    handler: F,
    req: Request,
    ctx: RequestContext<'a>,
) -> Result<Response>
where
    F: Fn(Request, RequestContext<'a>, User) -> Fut,
    Fut: std::future::Future<Output = Result<Response>>,
{
    let user = extract_auth_context(&req)?;

    handler(req, ctx, user).await
}

pub fn extract_auth_context(req: &Request) -> Result<User> {
    let headers = req.headers();

    let user_json = headers
        .get("X-User-Info")?
        .ok_or_else(|| worker::Error::RustError("Missing X-User-Info header".into()))?;

    serde_json::from_str::<User>(&user_json)
        .map_err(|e| worker::Error::RustError(format!("Invalid user info: {}", e)))
}
