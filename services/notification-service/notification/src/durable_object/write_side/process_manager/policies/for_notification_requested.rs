use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};
use fern_labour_notifications_shared::ServiceCommand;

use crate::durable_object::write_side::{
    domain::{Notification, events::NotificationRequested},
    process_manager::types::{Effect, IdempotencyKey},
};

impl HasPolicies<Notification, Effect> for NotificationRequested {
    fn policies() -> &'static [PolicyFn<Self, Notification, Effect>] {
        &[render_content_on_request]
    }
}

fn render_content_on_request(
    event: &NotificationRequested,
    ctx: &PolicyContext<Notification>,
) -> Vec<Effect> {
    vec![Effect::ServiceCommand {
        command: ServiceCommand::RenderNotification {
            notification_id: event.notification_id,
            channel: ctx.state.channel().clone(),
            template_data: event.template_data.clone(),
        },
        idempotency_key: IdempotencyKey::for_command(event.notification_id, ctx.sequence, "render"),
    }]
}
