use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use worker::{Request, Response, Result, RouteContext};

use crate::api_worker::AppState;

pub fn create_options_handler(
    req: Request,
    ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let cors_context = CorsContext::new(ctx.data.config.allowed_origins, &req);

    match cors_context.validate(&req) {
        Ok(_) => cors_context.preflight_response(),
        Err(response) => Ok(response),
    }
}

fn internal_auth(req: &Request, internal_service_token: &str) -> Option<User> {
    let service_id = req.headers().get("X-Service-ID").ok().flatten()?;

    let token = req.headers().get("X-Internal-Auth").ok().flatten()?;

    if token != internal_service_token {
        return None;
    };
    Some(User::internal(&service_id))
}

pub async fn authenticated<F, Fut>(
    handler: F,
    req: Request,
    ctx: RouteContext<AppState>,
) -> Result<Response>
where
    F: Fn(Request, RouteContext<AppState>, CorsContext, User) -> Fut,
    Fut: std::future::Future<Output = Result<Response>>,
{
    let cors_context = CorsContext::new(ctx.data.config.allowed_origins.clone(), &req);
    if let Err(response) = cors_context.validate(&req) {
        return Ok(response);
    }

    let Some(user) = internal_auth(&req, &ctx.data.config.internal_service_token) else {
        return Response::error("Unauthorised: Not Authenticated".to_string(), 401);
    };

    handler(req, ctx, cors_context, user).await
}

pub async fn public<F, Fut>(
    handler: F,
    req: Request,
    ctx: RouteContext<AppState>,
) -> Result<Response>
where
    F: Fn(Request, RouteContext<AppState>, CorsContext) -> Fut,
    Fut: std::future::Future<Output = Result<Response>>,
{
    let cors_context = CorsContext::new(ctx.data.config.allowed_origins.clone(), &req);
    if let Err(response) = cors_context.validate(&req) {
        return Ok(response);
    }

    handler(req, ctx, cors_context).await
}
