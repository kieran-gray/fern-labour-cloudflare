use tracing::info;
use worker::{Request, Response, Result, RouteContext};

use crate::{application::exceptions::AppError, setup::app_state::AppState};

use fern_labour_workers_shared::{auth_issuers, cors::CorsContext};

pub async fn authenticated<F, Fut>(
    handler: F,
    req: Request,
    ctx: RouteContext<AppState>,
) -> Result<Response>
where
    F: Fn(Request, RouteContext<AppState>, CorsContext, String) -> Fut,
    Fut: std::future::Future<Output = Result<Response>>,
{
    let cors_context = CorsContext::new(ctx.data.config.allowed_origins.clone(), &req);
    if let Err(response) = cors_context.validate(&req) {
        return Ok(response);
    }

    let authorization = match req.headers().get("Authorization").ok().flatten() {
        Some(auth_header) => auth_header,
        None => {
            let response = Response::from(AppError::Unauthorised("Not Authenticated".into()));
            return Ok(cors_context.add_to_response(response));
        }
    };

    let user_id = match ctx
        .data
        .auth_service
        .verify_token(&authorization, vec![auth_issuers::CLOUDFLARE.to_string()])
        .await
    {
        Ok(user_id) => user_id,
        Err(e) => {
            info!(error = ?e, "User verification failed");
            let response =
                Response::from(AppError::Unauthorised("User verification failed".into()));
            return Ok(cors_context.add_to_response(response));
        }
    };

    handler(req, ctx, cors_context, user_id).await
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
