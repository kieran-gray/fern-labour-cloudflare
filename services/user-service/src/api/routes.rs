use fern_labour_workers_shared::clients::worker_clients::user::{
    GetUserResponse, GetUsersRequest, GetUsersResponse,
};
use tracing::{error, info};
use worker::{Request, Response, RouteContext};

use crate::setup::app_state::AppState;

pub async fn get_user(_req: Request, ctx: RouteContext<AppState>) -> worker::Result<Response> {
    let Some(user_id) = ctx.param("user") else {
        error!("No user_id provided in request");
        return Response::error("No user_id provided in request", 400);
    };

    info!(user_id = ?user_id, "Processing get_user request");

    match ctx.data.clerk_client.get_user(user_id).await {
        Ok(user) => Ok(Response::from_json(&GetUserResponse { user })?.with_status(200)),
        Err(e) => {
            error!(error = ?e, "Failed to fetch user");
            Response::error(format!("Failed to fetch user: {e}"), 500)
        }
    }
}

pub async fn get_users(mut req: Request, ctx: RouteContext<AppState>) -> worker::Result<Response> {
    let request_dto: GetUsersRequest = match req.json().await {
        Ok(dto) => dto,
        Err(e) => {
            error!(error = ?e, "Failed to parse request body");
            return Response::error(format!("Failed to parse request body: {e}"), 400);
        }
    };

    info!(user_ids = ?request_dto.user_ids, "Processing get_users request");

    match ctx.data.clerk_client.get_users(request_dto.user_ids).await {
        Ok(users) => {
            info!("Processed get_users request, found {} users", users.len());
            Ok(Response::from_json(&GetUsersResponse { users })?.with_status(200))
        }
        Err(e) => {
            error!(error = ?e, "Failed to fetch user");
            Response::error(format!("Failed to fetch user: {e}"), 500)
        }
    }
}
