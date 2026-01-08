use fern_labour_labour_shared::{ApiCommand, ApiQuery};
use serde::{Deserialize, Serialize};
use tracing::error;
use worker::{Result, WebSocketIncomingMessage};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum WebSocketRequest {
    Command {
        #[serde(flatten)]
        command: ApiCommand,
    },
    Query {
        #[serde(flatten)]
        query: ApiQuery,
    },
    ServerTimestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,

    #[serde(flatten)]
    pub request: WebSocketRequest,
}

pub fn parse_websocket_message(message: WebSocketIncomingMessage) -> Result<WebSocketMessage> {
    let message: WebSocketMessage = match message {
        WebSocketIncomingMessage::String(data) => match serde_json::from_str(&data) {
            Ok(cmd) => cmd,
            Err(e) => {
                error!(error = ?e, message = %data, "Failed to parse WebSocketCommand from WebSocket message");
                return Err(worker::Error::RustError(format!(
                    "Failed to parse WebSocketCommand: {e}"
                )));
            }
        },
        WebSocketIncomingMessage::Binary(data) => match serde_json::from_slice(&data) {
            Ok(cmd) => cmd,
            Err(e) => {
                error!(error = ?e, "Failed to parse WebSocketCommand from WebSocket message");
                return Err(worker::Error::RustError(format!(
                    "Failed to parse WebSocketCommand: {e}"
                )));
            }
        },
    };
    Ok(message)
}
