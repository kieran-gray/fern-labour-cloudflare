use fern_labour_event_sourcing_rs::{HasPolicies, PolicyContext, PolicyFn};

use crate::durable_object::write_side::{
    domain::{Notification, NotificationCommand, NotificationContentRedacted},
    process_manager::types::{Effect, IdempotencyKey},
};

impl HasPolicies<Notification, Effect> for NotificationContentRedacted {
    fn policies() -> &'static [PolicyFn<Self, Notification, Effect>] {
        &[delete_notification]
    }
}

fn delete_notification(
    event: &NotificationContentRedacted,
    ctx: &PolicyContext<Notification>,
) -> Vec<Effect> {
    vec![Effect::DomainCommand {
        command: NotificationCommand::DeleteNotification {
            notification_id: event.notification_id,
        },
        idempotency_key: IdempotencyKey::for_command(event.notification_id, ctx.sequence, "delete"),
    }]
}
