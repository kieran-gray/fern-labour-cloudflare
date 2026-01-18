use tracing::{error, info};
use worker::{Request, Response, Result, RouteContext};

use crate::{
    api::schemas::{
        requests::VerifyTokenRequest,
        responses::{AuthenticateResponse, VerifyTokenResponse},
    },
    setup::app_state::AppState,
};

pub async fn verify_token_handler(
    mut req: Request,
    ctx: RouteContext<AppState>,
) -> Result<Response> {
    let body = match req.json::<VerifyTokenRequest>().await {
        Ok(body) => body,
        Err(e) => {
            error!(error = ?e, "Failed to parse request body");
            return Response::error("Invalid request body", 400);
        }
    };

    match ctx.data.auth_service.get_user_id(&body.token).await {
        Ok(user_id) => {
            info!(user_id = %user_id, "Token verified successfully");
            let response = VerifyTokenResponse { user_id };
            Response::from_json(&response)
        }
        Err(e) => {
            error!(error = %e, "Token verification failed");
            Ok(e.into())
        }
    }
}

pub async fn authenticate_handler(
    mut req: Request,
    ctx: RouteContext<AppState>,
) -> Result<Response> {
    let body = match req.json::<VerifyTokenRequest>().await {
        Ok(body) => body,
        Err(e) => {
            error!(error = ?e, "Failed to parse request body");
            return Response::error("Invalid request body", 400);
        }
    };

    match ctx.data.auth_service.authenticate(&body.token).await {
        Ok(user) => {
            info!(
                user_id = %user.user_id,
                issuer = %user.issuer,
                email = ?user.email,
                "Authentication successful"
            );
            let response = AuthenticateResponse { user };
            Response::from_json(&response)
        }
        Err(e) => {
            error!(error = %e, "Authentication failed");
            Ok(e.into())
        }
    }
}
