use tracing::{error, warn};
use worker::{Request, Response, RouteContext};

use crate::{
    infrastructure::resend::webhook_event::ResendWebhookEvent, setup::app_state::AppState,
};

pub async fn process_resend_webhook(
    mut req: Request,
    ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let provider = "resend";
    let body_bytes = req
        .bytes()
        .await
        .map_err(|e| worker::Error::RustError(format!("Failed to read body: {}", e)))?;

    let headers = req.headers();
    if let Err(e) = ctx
        .data
        .webhook_verification
        .verify(provider, headers, &body_bytes)
    {
        error!("Resend webhook verification failed: {}", e);
        return Response::error("Unauthorized", 401);
    }

    let event: ResendWebhookEvent = serde_json::from_slice(&body_bytes)
        .map_err(|e| worker::Error::RustError(format!("Failed to parse JSON: {}", e)))?;

    match ctx
        .data
        .webhook_interpreter
        .interpret(provider, &event.external_id(), event.event_type())
        .await
    {
        Ok(interpretation) => Ok(Response::from_json(&interpretation)?.with_status(200)),
        Err(err) => {
            warn!("Failed to process webhook: {err}");
            Response::error(err.to_string(), 400)
        }
    }
}

pub async fn process_twilio_webhook(
    mut req: Request,
    ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let provider = "twilio";
    let body_bytes = req
        .bytes()
        .await
        .map_err(|e| worker::Error::RustError(format!("Failed to read body: {}", e)))?;

    let headers = req.headers();
    if let Err(e) = ctx
        .data
        .webhook_verification
        .verify(provider, headers, &body_bytes)
    {
        error!("Twilio webhook verification failed: {}", e);
        return Response::error("Unauthorized", 401);
    }

    let body_str = String::from_utf8_lossy(&body_bytes);
    let form_params: Vec<(String, String)> = form_urlencoded::parse(body_str.as_bytes())
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let message_sid = form_params
        .iter()
        .find(|(k, _)| k == "MessageSid")
        .map(|(_, v)| v.as_str())
        .ok_or_else(|| worker::Error::RustError("Missing MessageSid".to_string()))?;

    let message_status = form_params
        .iter()
        .find(|(k, _)| k == "MessageStatus")
        .map(|(_, v)| v.as_str())
        .ok_or_else(|| worker::Error::RustError("Missing MessageStatus".to_string()))?;

    match ctx
        .data
        .webhook_interpreter
        .interpret(provider, message_sid, message_status)
        .await
    {
        Ok(interpretation) => Ok(Response::from_json(&interpretation)?.with_status(200)),
        Err(err) => {
            warn!("Failed to process webhook: {err}");
            Response::error(err.to_string(), 400)
        }
    }
}
