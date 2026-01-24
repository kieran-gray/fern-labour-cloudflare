use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};
use fern_labour_notifications_shared::ServiceCommand;

use crate::durable_object::write_side::{
    domain::{Notification, events::NotificationDelivered},
    process_manager::types::{Effect, IdempotencyKey},
};

impl HasPolicies<Notification, Effect> for NotificationDelivered {
    fn policies() -> &'static [PolicyFn<Self, Notification, Effect>] {
        &[redact_notification_content]
    }
}

fn redact_notification_content(
    event: &NotificationDelivered,
    ctx: &PolicyContext<Notification>,
) -> Vec<Effect> {
    vec![Effect::ServiceCommand {
        command: ServiceCommand::RedactNotificationContent {
            notification_id: event.notification_id,
            provider: event.provider.clone(),
            external_id: event.external_id.clone(),
        },
        idempotency_key: IdempotencyKey::for_command(event.notification_id, ctx.sequence, "redact"),
    }]
}
