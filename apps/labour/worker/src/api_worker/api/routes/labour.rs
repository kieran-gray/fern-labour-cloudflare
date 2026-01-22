use fern_labour_labour_shared::{ApiCommand, LabourCommand};
use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use serde::Serialize;
use tracing::{error, info};
use uuid::Uuid;
use worker::{Request, Response, RouteContext};

use crate::{
    api_worker::{
        AppState,
        api::{exceptions::ApiError, schemas::requests::PlanLabourRequest},
    },
    durable_object::read_side::read_models::labour_status::LabourStatusReadModelQueryHandler,
};

#[derive(Serialize)]
struct PlanLabourResponse {
    labour_id: String,
}

pub async fn handle_plan_labour(
    mut req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let request_dto: PlanLabourRequest = match req.json().await {
        Ok(dto) => dto,
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to parse request body");
            let response = Response::from(ApiError::ValidationError(
                "Failed to parse request body".into(),
            ));
            return Ok(cors_context.add_to_response(response));
        }
    };

    let existing_active = ctx
        .data
        .labour_status_query
        .get_active(user.user_id.clone())
        .await
        .map_err(|e| format!("Failed to query active labour: {e}"))?;

    if existing_active.is_some() {
        info!(user_id = %user.user_id, "User already has an active labour");
        let response = Response::from(ApiError::ValidationError(
            "You already have an active labour. Please complete it before planning a new one."
                .into(),
        ));
        return Ok(cors_context.add_to_response(response));
    }

    let labour_id = Uuid::now_v7();
    let command = ApiCommand::Labour(LabourCommand::PlanLabour {
        labour_id,
        mother_id: user.user_id.clone(),
        mother_name: user.name.clone().unwrap_or_else(|| "unknown".to_string()),
        first_labour: request_dto.first_labour,
        due_date: request_dto.due_date,
        labour_name: request_dto.labour_name,
    });

    ctx.data
        .do_client
        .send_command(labour_id, command, &user, "/api/command")
        .await
        .map_err(|e| format!("Failed to send command to labour aggregate: {e}"))?;

    info!(
        labour_id = %labour_id,
        "Labour planned successfully"
    );

    let response_body = PlanLabourResponse {
        labour_id: labour_id.to_string(),
    };

    let response = Response::from_json(&response_body)
        .map_err(|e| format!("Failed to serialize response: {e}"))?;

    Ok(cors_context.add_to_response(response))
}

pub async fn get_labour_history(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let labour_status = ctx
        .data
        .labour_status_query
        .get_by_user_id(user.user_id)
        .await
        .map_err(|e| format!("Failed to query labour status: {e}"))?;

    let response = Response::from_json(&labour_status)
        .map_err(|e| format!("Failed to serialize response: {e}"))?;

    Ok(cors_context.add_to_response(response))
}

pub async fn get_active_labour(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let labour_status = ctx
        .data
        .labour_status_query
        .get_active(user.user_id)
        .await
        .map_err(|e| format!("Failed to query active labour: {e}"))?;

    let response = Response::from_json(&labour_status)
        .map_err(|e| format!("Failed to serialize response: {e}"))?;

    Ok(cors_context.add_to_response(response))
}
