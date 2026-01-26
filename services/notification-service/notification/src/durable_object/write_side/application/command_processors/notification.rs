use anyhow::{Result, anyhow};
use fern_labour_event_sourcing_rs::{Aggregate, AggregateRepositoryTrait};
use fern_labour_notifications_shared::NotificationCommand;

use crate::durable_object::write_side::domain::Notification;

pub struct NotificationCommandProcessor {
    repository: Box<dyn AggregateRepositoryTrait<Notification>>,
}

impl NotificationCommandProcessor {
    pub fn new(repository: Box<dyn AggregateRepositoryTrait<Notification>>) -> Self {
        Self { repository }
    }

    pub fn handle_command(&self, command: NotificationCommand, user_id: String) -> Result<()> {
        let aggregate = self.repository.load()?;

        let events = Notification::handle_command(aggregate.as_ref(), command)
            .map_err(|e| anyhow!("Domain error: {}", e))?;

        if events.is_empty() {
            return Ok(());
        }

        self.repository.save(aggregate.as_ref(), &events, user_id)?;
        Ok(())
    }
}
