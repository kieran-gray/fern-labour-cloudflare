use std::rc::Rc;

use fern_labour_event_sourcing_rs::AggregateRepositoryTrait;
use tracing::{info, warn};
use worker::{Request, Response, Result, State, WebSocketPair};

use crate::durable_object::{
    authorization::{Action, Authorizer, resolve_principal},
    http::middleware::extract_auth_context,
    write_side::domain::Labour,
};

#[derive(Clone)]
pub struct WebSocketService {
    repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
    authorizer: Authorizer,
}

impl WebSocketService {
    pub fn new(repository: Rc<dyn AggregateRepositoryTrait<Labour>>) -> Self {
        Self {
            repository,
            authorizer: Authorizer::new(),
        }
    }

    pub async fn upgrade_connection(&self, req: Request, state: &State) -> Result<Response> {
        let user = extract_auth_context(&req)?;

        let aggregate = self
            .repository
            .load()
            .map_err(|_| worker::Error::RustError("Failed to load aggregate".to_string()))?;

        let principal = resolve_principal(&user, aggregate.as_ref());

        if let Err(reason) =
            self.authorizer
                .authorize(&principal, &Action::UpgradeConnection, aggregate.as_ref())
        {
            return Response::error(reason.to_string(), 403);
        };

        info!(user_id = %user.user_id, "Connecting websocket");

        let WebSocketPair { client, server } = WebSocketPair::new()?;
        state.accept_web_socket(&server);

        server.serialize_attachment(&user).map_err(|e| {
            warn!(error = %e, "Failed to attach user to websocket");
            worker::Error::RustError(
                "Failure adding attachment to websocket connection".to_string(),
            )
        })?;

        let mut response = Response::from_websocket(client)?;
        response
            .headers_mut()
            .set("Sec-WebSocket-Protocol", "fernlabour.com")?;
        Ok(response)
    }
}
