use fern_labour_workers_shared::User;
use tracing::{error, info};
use worker::{Request, Response};

use crate::durable_object::api::{ApiResult, router::RequestContext};

pub async fn handle_events_query(
    _req: Request,
    ctx: RequestContext<'_>,
    user: User,
) -> worker::Result<Response> {
    info!(user_id = %user.user_id, "Processing events query");

    let result = ctx.data.read_model().query_service.get_event_stream();

    if let Err(ref err) = result {
        error!(error = %err, "Query execution failed");
    } else {
        info!("Query executed successfully");
    }

    Ok(ApiResult::from_json_result(result).into_response())
}
