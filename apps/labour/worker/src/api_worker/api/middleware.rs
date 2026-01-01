use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::info;
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

    let authorization = match req.headers().get("Authorization").ok().flatten() {
        Some(auth_header) => auth_header,
        None => {
            let response = Response::error("Unauthorised: Not Authenticated".to_string(), 401)?;
            return Ok(cors_context.add_to_response(response));
        }
    };
    let user = match ctx.data.auth_service.authenticate(&authorization).await {
        Ok(user) => user,
        Err(e) => {
            info!(error = ?e, "User verification failed");
            let response =
                Response::error("Unauthorised: User verification failed".to_string(), 404)?;
            return Ok(cors_context.add_to_response(response));
        }
    };

    handler(req, ctx, cors_context, user).await
}

pub async fn websocket_authenticated<F, Fut>(
    handler: F,
    req: Request,
    ctx: RouteContext<AppState>,
) -> Result<Response>
where
    F: Fn(Request, RouteContext<AppState>, CorsContext, User) -> Fut,
    Fut: std::future::Future<Output = Result<Response>>,
{
    const PROTOCOL_HEADER: &str = "base64url.bearer.authorization.fernlabour.com.";

    let cors_context = CorsContext::new(ctx.data.config.allowed_origins.clone(), &req);
    if let Err(response) = cors_context.validate(&req) {
        return Ok(response);
    }

    let Some(protocols) = req.headers().get("Sec-WebSocket-Protocol").ok().flatten() else {
        let response = Response::error("Unauthorised: Not Authenticated".to_string(), 401)?;
        return Ok(cors_context.add_to_response(response));
    };

    let Some(authorization) = protocols
        .split(",")
        .find(|proto| proto.starts_with(PROTOCOL_HEADER))
        .and_then(|proto| proto.strip_prefix(PROTOCOL_HEADER))
    else {
        let response = Response::error("Unauthorised: Not Authenticated".to_string(), 401)?;
        return Ok(cors_context.add_to_response(response));
    };

    let user = match ctx.data.auth_service.authenticate(authorization).await {
        Ok(user) => user,
        Err(e) => {
            info!(error = ?e, "User verification failed");
            let response =
                Response::error("Unauthorised: User verification failed".to_string(), 404)?;
            return Ok(cors_context.add_to_response(response));
        }
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
