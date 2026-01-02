use fern_labour_workers_shared::{
    CorsContext,
    clients::{AuthServiceClient, worker_clients::auth::User},
};
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

fn internal_auth(req: &Request, internal_service_token: &str) -> Option<User> {
    let service_id = req.headers().get("X-Service-ID").ok().flatten()?;

    let token = req.headers().get("X-Internal-Auth").ok().flatten()?;

    if token != internal_service_token {
        return None;
    };
    Some(User::internal(&service_id))
}

#[allow(clippy::borrowed_box)]
async fn provider_auth(
    req: &Request,
    auth_service: &Box<dyn AuthServiceClient>,
) -> std::result::Result<User, Result<Response>> {
    let authorization = match req.headers().get("Authorization").ok().flatten() {
        Some(auth_header) => auth_header,
        None => {
            return Err(Response::error(
                "Unauthorised: Not Authenticated".to_string(),
                401,
            ));
        }
    };
    match auth_service.authenticate(&authorization).await {
        Ok(user) => Ok(user),
        Err(e) => {
            info!(error = ?e, "User verification failed");
            Err(Response::error(
                "Unauthorised: User verification failed".to_string(),
                401,
            ))
        }
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

    let user = match internal_auth(&req, &ctx.data.config.internal_auth_token) {
        Some(user) => user,
        None => match provider_auth(&req, &ctx.data.auth_service).await {
            Ok(user) => user,
            Err(result) => return result,
        },
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
