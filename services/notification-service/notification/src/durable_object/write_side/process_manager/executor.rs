use anyhow::{Result, anyhow};
use async_trait::async_trait;
use fern_labour_notifications_shared::ServiceCommand;

use crate::durable_object::write_side::{
    application::command_processors::{NotificationCommandProcessor, ServiceCommandProcessor},
    domain::NotificationCommand,
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
            .map_err(|e| anyhow!("Failed to execute service command: {e}"))?;

        self.notification_command_processor
            .handle_command(notification_command, "process-manager".to_string())
            .map_err(|e| anyhow!("Failed to handle resulting notification command: {e}"))?;

        Ok(())
    }

    async fn handle_domain_command(&self, command: NotificationCommand) -> Result<()> {
        self.notification_command_processor
            .handle_command(command, "process-manager".to_string())
            .map_err(|e| anyhow!("Failed to handle notification command: {e}"))?;

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
            Effect::DomainCommand { command, .. } => {
                self.handle_domain_command(command.clone()).await
            }
        }
    }
}
