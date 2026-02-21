use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};
use fern_labour_notifications_shared::ServiceCommand;

use crate::durable_object::write_side::{
    domain::{Notification, events::RenderedContentStored},
    process_manager::types::{Effect, IdempotencyKey},
};

impl HasPolicies<Notification, Effect> for RenderedContentStored {
    fn policies() -> &'static [PolicyFn<Self, Notification, Effect>] {
        &[dispatch_or_schedule_notification_on_render]
    }
}

fn dispatch_or_schedule_notification_on_render(
    event: &RenderedContentStored,
    ctx: &PolicyContext<Notification>,
) -> Vec<Effect> {
    let command = match ctx.state.scheduled_at() {
        Some(scheduled_at) => Effect::ServiceCommand {
            command: ServiceCommand::ScheduleNotification {
                notification_id: event.notification_id,
                channel: ctx.state.channel().clone(),
                destination: ctx.state.destination().clone(),
                scheduled_at: scheduled_at.clone(),
                rendered_content: event.rendered_content.clone(),
            },
            idempotency_key: IdempotencyKey::for_command(
                event.notification_id,
                ctx.sequence,
                "schedule",
            ),
        },
        None => Effect::ServiceCommand {
            command: ServiceCommand::DispatchNotification {
                notification_id: event.notification_id,
                channel: ctx.state.channel().clone(),
                destination: ctx.state.destination().clone(),
                rendered_content: event.rendered_content.clone(),
            },
            idempotency_key: IdempotencyKey::for_command(
                event.notification_id,
                ctx.sequence,
                "dispatch",
            ),
        },
    };

    vec![command]
}
