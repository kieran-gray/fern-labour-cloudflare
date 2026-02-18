use fern_labour_notifications_shared::service_clients::dispatch::{
    requests::ScheduleRequest, responses::ScheduleResponse,
};
use tracing::{error, info};
use worker::{Request, Response, RouteContext};

use crate::{application::dispatch::ScheduleContext, setup::app_state::AppState};

pub async fn schedule(
    mut req: Request,
    ctx: RouteContext<AppState>,
    service_id: String,
) -> worker::Result<Response> {
    let schedule_request: ScheduleRequest = match req.json().await {
        Ok(r) => r,
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to parse schedule request");
            return Response::error("Failed to parse schedule request", 400);
        }
    };

    let context = ScheduleContext::from(schedule_request);

    info!(
        service_id = %service_id,
        channel = %context.channel(),
        destination = %context.destination,
        scheduled_at = %context.scheduled_at,
        "Scheduling notification"
    );

    match ctx.data.notification_router.schedule(context).await {
        Ok(result) => {
            info!("Notification scheduled successfully");
            let response: ScheduleResponse = result.into();
            Response::from_json(&response)
        }
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to schedule notification");
            Response::error(format!("Failed to schedule notification: {e}"), 500)
        }
    }
}
