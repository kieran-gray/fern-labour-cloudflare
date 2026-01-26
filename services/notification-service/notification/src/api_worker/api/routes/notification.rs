use fern_labour_notifications_shared::service_clients::notification::NotificationRequest;
use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use tracing::{error, info};
use uuid::Uuid;
use worker::{Request, Response, RouteContext};

use crate::api_worker::{
    AppState,
    api::{exceptions::ApiError, schemas::requests::NotificationRequestExt},
};

pub async fn handle_create_notification(
    mut req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let request_dto: NotificationRequest = match req.json().await {
        Ok(dto) => dto,
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to parse request body");
            let response = Response::from(ApiError::ValidationError(
                "Failed to parse request body".into(),
            ));
            return Ok(cors_context.add_to_response(response));
        }
    };

    let notification_id = Uuid::now_v7();

    let domain_command = match request_dto.try_into_domain(notification_id) {
        Ok(cmd) => cmd,
        Err(e) => {
            error!(
                notification_id = %notification_id,
                user_id = %user.user_id,
                error = %e,
                "Validation failed for notification request"
            );
            let response = Response::from(ApiError::ValidationError(e.to_string()));
            return Ok(cors_context.add_to_response(response));
        }
    };

    info!(
        notification_id = %notification_id,
        user_id = %user.user_id,
        "Creating notification via public API"
    );

    let res = ctx
        .data
        .do_client
        .send_command(
            notification_id,
            domain_command,
            &user,
            "/notification/command",
        )
        .await
        .map_err(|e| format!("Failed to send command to notification aggregate: {e}"))?;

    info!(
        notification_id = %notification_id,
        "Notification created successfully"
    );

    Ok(cors_context.add_to_response(res))
}
