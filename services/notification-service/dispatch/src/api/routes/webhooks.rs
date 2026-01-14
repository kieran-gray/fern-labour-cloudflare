use chrono::Utc;
use fern_labour_event_sourcing_rs::CommandEnvelope;
use fern_labour_notifications_shared::{
    InternalCommand, QueueMessage, value_objects::NotificationStatus,
};
use tracing::{error, info};
use uuid::Uuid;
use worker::{Request, Response, RouteContext};

use crate::{
    application::webhook::WebhookInterpretation,
    infrastructure::resend::webhook_event::ResendWebhookEvent, setup::app_state::AppState,
};

fn process_webhook_interpretation(
    interpretation: WebhookInterpretation,
) -> Option<CommandEnvelope<QueueMessage>> {
    let command = match interpretation.status {
        NotificationStatus::DELIVERED => Some(InternalCommand::MarkAsDelivered {
            notification_id: interpretation.notification_id,
        }),
        NotificationStatus::FAILED => Some(InternalCommand::MarkAsFailed {
            notification_id: interpretation.notification_id,
            reason: Some("Provider webhook reported failure".to_string()),
        }),
        _ => None,
    }?;

    let correlation_id = Uuid::now_v7();
    Some(CommandEnvelope::enrich(
        QueueMessage::Internal(command),
        interpretation.notification_id,
        correlation_id,
        correlation_id,
        "dispatch".to_string(),
        Utc::now(),
    ))
}

pub async fn handle_resend_webhook(
    mut req: Request,
    ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let body_bytes = req
        .bytes()
        .await
        .map_err(|e| worker::Error::RustError(format!("Failed to read body: {}", e)))?;

    let headers = req.headers();
    if let Err(e) = ctx
        .data
        .webhook_verification
        .verify("resend", headers, &body_bytes)
    {
        error!("Resend webhook verification failed: {}", e);
        return Response::error("Unauthorized", 401);
    }

    let event: ResendWebhookEvent = serde_json::from_slice(&body_bytes)
        .map_err(|e| worker::Error::RustError(format!("Failed to parse JSON: {}", e)))?;

    let external_id = event.external_id();
    let event_type = event.event_type();
    let mut commands: Vec<CommandEnvelope<QueueMessage>> = Vec::new();

    match ctx
        .data
        .webhook_interpreter
        .interpret(&external_id, event_type)
        .await
    {
        Ok(interpretation) => {
            info!(
                "Interpreted webhook: notification_id={}, status={:?}",
                interpretation.notification_id, interpretation.status
            );
            if let Some(command_envelope) = process_webhook_interpretation(interpretation) {
                commands.push(command_envelope);
            }
        }
        Err(e) => {
            error!("Failed to interpret webhook: {}", e);
        }
    }

    match ctx.data.command_producer.publish_batch(commands).await {
        Ok(_) => info!("Published commands to command bus"),
        Err(e) => error!("Failed to publish commands to command bus: {e}"),
    }
    Response::empty()
}

pub async fn handle_twilio_webhook(
    mut req: Request,
    ctx: RouteContext<AppState>,
) -> worker::Result<Response> {
    let body_bytes = req
        .bytes()
        .await
        .map_err(|e| worker::Error::RustError(format!("Failed to read body: {}", e)))?;

    let headers = req.headers();
    if let Err(e) = ctx
        .data
        .webhook_verification
        .verify("twilio", headers, &body_bytes)
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

    let mut commands: Vec<CommandEnvelope<QueueMessage>> = Vec::new();

    match ctx
        .data
        .webhook_interpreter
        .interpret(message_sid, message_status)
        .await
    {
        Ok(interpretation) => {
            info!(
                "Interpreted webhook: notification_id={}, status={:?}",
                interpretation.notification_id, interpretation.status
            );
            if let Some(command_envelope) = process_webhook_interpretation(interpretation) {
                commands.push(command_envelope);
            }
        }
        Err(e) => {
            error!("Failed to interpret webhook: {}", e);
        }
    }

    match ctx.data.command_producer.publish_batch(commands).await {
        Ok(_) => info!("Published commands to command bus"),
        Err(e) => error!("Failed to publish commands to command bus: {e}"),
    }
    Response::empty()
}
