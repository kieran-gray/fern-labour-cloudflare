use chrono::NaiveDate;
use fern_labour_event_sourcing_rs::DecodedCursor;
use fern_labour_notifications_shared::AdminApiCommand;
use fern_labour_workers_shared::{CorsContext, clients::worker_clients::auth::User};
use std::collections::HashMap;
use tracing::{error, info};
use worker::{Request, Response, RouteContext};

use crate::{
    api_worker::{AppState, api::exceptions::ApiError},
    read_models::notification_activity::read_model::NotificationActivity,
};

pub async fn handle_admin_command(
    mut req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    let admin_command: AdminApiCommand = match req.json().await {
        Ok(cmd) => cmd,
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to parse admin command");
            let response = Response::from(ApiError::ValidationError(
                "Failed to parse admin command".into(),
            ));
            return Ok(cors_context.add_to_response(response));
        }
    };

    let notification_id = admin_command.notification_id();
    let command_name = admin_command.command_name();

    info!(
        notification_id = %notification_id,
        user_id = %user.user_id,
        command_name = %command_name,
        "Executing admin command"
    );

    let res = match admin_command {
        AdminApiCommand::Admin(command) => ctx
            .data
            .do_client
            .send_command(notification_id, command, &user, "/admin/command")
            .await
            .map_err(|e| format!("Failed to send admin command to DO: {e}"))?,

        AdminApiCommand::Internal(command) => ctx
            .data
            .do_client
            .send_command(notification_id, command, &user, "/notification/command")
            .await
            .map_err(|e| format!("Failed to send internal command to DO: {e}"))?,
    };

    info!(
        notification_id = %notification_id,
        command_name = %command_name,
        "Admin command executed successfully"
    );

    Ok(cors_context.add_to_response(res))
}

pub async fn rebuild_notification_activity(
    _req: Request,
    ctx: RouteContext<AppState>,
    cors_context: CorsContext,
    user: User,
) -> worker::Result<Response> {
    info!(user_id = %user.user_id, "Rebuilding notification activity projection");

    match rebuild_activity_internal(&ctx.data).await {
        Ok(count) => {
            info!(
                user_id = %user.user_id,
                dates_updated = count,
                "Successfully rebuilt notification activity"
            );
            let response = Response::from_json(&serde_json::json!({
                "success": true,
                "message": format!("Successfully rebuilt activity for {} dates", count),
                "dates_updated": count
            }))?;
            Ok(cors_context.add_to_response(response))
        }
        Err(e) => {
            error!(user_id = %user.user_id, error = ?e, "Failed to rebuild notification activity");
            let response = Response::from(ApiError::InternalServerError(
                "Failed to rebuild notification activity".into(),
            ));
            Ok(cors_context.add_to_response(response))
        }
    }
}

async fn rebuild_activity_internal(app_state: &AppState) -> anyhow::Result<usize> {
    let mut date_counts: HashMap<NaiveDate, i64> = HashMap::new();
    let mut cursor: Option<DecodedCursor> = None;
    let batch_size = 1000;

    loop {
        let notifications = app_state
            .notification_status_query
            .get_notifications(batch_size + 1, cursor.clone())
            .await?;

        if notifications.is_empty() {
            break;
        }

        let has_more = notifications.len() > batch_size;
        let process_count = if has_more {
            batch_size
        } else {
            notifications.len()
        };

        if has_more {
            let last = &notifications[batch_size - 1];
            cursor = Some(DecodedCursor {
                last_updated_at: last.updated_at,
                last_id: last.notification_id,
            });
        }

        for notification in notifications.iter().take(process_count) {
            let date = notification.updated_at.date_naive();
            *date_counts.entry(date).or_insert(0) += 1;
        }

        if !has_more {
            break;
        }
    }

    for (date, count) in &date_counts {
        let datetime = date
            .and_hms_opt(0, 0, 0)
            .ok_or_else(|| anyhow::anyhow!("Failed to create datetime"))?
            .and_utc();

        let activity = NotificationActivity::new(*count, datetime);
        app_state
            .notification_activity_repository
            .upsert(&activity)
            .await?;
    }

    Ok(date_counts.len())
}
