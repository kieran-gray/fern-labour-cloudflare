use fern_labour_notifications_shared::service_clients::{DispatchRequest, DispatchResponse};
use tracing::{error, info};
use worker::{Request, Response, RouteContext};

use crate::{application::dispatch::DispatchContext, setup::app_state::AppState};

pub async fn dispatch(
    mut req: Request,
    ctx: RouteContext<AppState>,
    service_id: String,
) -> worker::Result<Response> {
    let dispatch_request: DispatchRequest = match req.json().await {
        Ok(r) => r,
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to parse dispatch request");
            return Response::error("Failed to parse dispatch request", 400);
        }
    };

    let context = DispatchContext::from(dispatch_request);

    info!(
        service_id = %service_id,
        channel = %context.channel(),
        destination = %context.destination,
        "Dispatching notification"
    );

    match ctx.data.notification_router.dispatch(context).await {
        Ok(result) => {
            info!("Notification dispatched successfully");
            let response: DispatchResponse = result.into();
            Response::from_json(&response)
        }
        Err(e) => {
            error!(service_id = %service_id, error = ?e, "Failed to dispatch notification");
            Response::error(format!("Failed to dispatch notification: {e}"), 500)
        }
    }
}
