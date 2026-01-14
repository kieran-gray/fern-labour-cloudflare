use anyhow::{Context, Result};
use async_trait::async_trait;
use fern_labour_notifications_shared::ServiceCommand;

use crate::durable_object::write_side::{
    application::command_processors::{NotificationCommandProcessor, ServiceCommandProcessor},
    process_manager::types::Effect,
};

#[async_trait(?Send)]
pub trait EffectExecutor {
    async fn execute(&self, effect: &Effect) -> Result<()>;
}

pub struct NotificationEffectExecutor {
    service_command_processor: ServiceCommandProcessor,
    notification_command_processor: NotificationCommandProcessor,
}

impl NotificationEffectExecutor {
    pub fn new(
        service_command_processor: ServiceCommandProcessor,
        notification_command_processor: NotificationCommandProcessor,
    ) -> Self {
        Self {
            service_command_processor,
            notification_command_processor,
        }
    }

    async fn handle_service_command(&self, command: ServiceCommand) -> Result<()> {
        let notification_command = self
            .service_command_processor
            .handle(command)
            .await
            .context("Failed to execute service command")?;

        self.notification_command_processor
            .handle_command(notification_command, "process-manager".to_string())
            .context("Failed to handle resulting notification command")?;

        Ok(())
    }
}

#[async_trait(?Send)]
impl EffectExecutor for NotificationEffectExecutor {
    async fn execute(&self, effect: &Effect) -> Result<()> {
        match effect {
            Effect::ServiceCommand { command, .. } => {
                self.handle_service_command(command.clone()).await
            }
        }
    }
}
