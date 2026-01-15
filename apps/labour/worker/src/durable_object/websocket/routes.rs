use tracing::{info, warn};
use worker::{Request, Response, Result, State, WebSocketPair};

use crate::durable_object::http::middleware::extract_auth_context;

pub async fn upgrade_connection(req: Request, state: &State) -> Result<Response> {
    let user = extract_auth_context(&req)?;

    info!(user_id = %user.user_id, "Connecting websocket");

    let WebSocketPair { client, server } = WebSocketPair::new()?;
    state.accept_web_socket(&server);

    server.serialize_attachment(&user).map_err(|e| {
        warn!(error = %e, "Failed to attach user to websocket");
        worker::Error::RustError("Failure adding attachment to websocket connection".to_string())
    })?;

    let mut response = Response::from_websocket(client)?;
    response
        .headers_mut()
        .set("Sec-WebSocket-Protocol", "fernlabour.com")?;
    Ok(response)
}
