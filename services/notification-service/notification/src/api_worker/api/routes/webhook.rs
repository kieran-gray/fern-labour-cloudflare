use fern_labour_notifications_shared::{InternalCommand, value_objects::NotificationStatus};
use fern_labour_workers_shared::User;
use tracing::{info, warn};
use worker::{Request, Response, RouteContext};

use crate::api_worker::AppState;

pub async fn process_delivery_webhook(
    req: Request,
    ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let webhook_interpretation = ctx
        .data
        .dispatch_client
        .handle_webhook(req)
        .await
        .map_err(|e| worker::Error::RustError(format!("Failed to process webhook: {}", e)))?;

    let notification = ctx
        .data
        .notification_detail_query
        .get_by_external_id(webhook_interpretation.external_id)
        .await
        .map_err(|e| worker::Error::RustError(format!("Failed to fetch notification: {}", e)))?;

    let user = User::internal("fern-labour-internal-notification");

    let command = match webhook_interpretation.status {
        NotificationStatus::DELIVERED => InternalCommand::MarkAsDelivered {
            notification_id: notification.notification_id,
        },
        NotificationStatus::FAILED => InternalCommand::MarkAsFailed {
            notification_id: notification.notification_id,
            reason: Some("Provider webhook reported failure".to_string()),
        },
        _ => return Response::empty(),
    };

    match ctx
        .data
        .do_client
        .send_command(
            notification.notification_id,
            command,
            &user,
            "/notification/command",
        )
        .await
    {
        Ok(_) => info!("Webhook notification status change successfully processed"),
        Err(_) => warn!("Failed to process webhook notification status change"),
    }
    Response::empty()
}
