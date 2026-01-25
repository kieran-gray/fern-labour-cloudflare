use anyhow::{Result, anyhow};
use fern_labour_notifications_shared::AdminCommand;
use tracing::{error, info};
use worker::{Response, Storage};

pub struct AdminCommandProcessor {
    storage: Storage,
}

impl AdminCommandProcessor {
    pub fn new(storage: Storage) -> Self {
        Self { storage }
    }

    pub async fn handle_command(&self, command: AdminCommand) -> Result<Response> {
        match command {
            AdminCommand::RebuildReadModels { aggregate_id } => {
                info!(aggregate_id = %aggregate_id, "Rebuilding read models");
                Ok(Response::empty()?.with_status(204))
            }
            AdminCommand::DeleteDurableObject { aggregate_id } => {
                info!(aggregate_id = %aggregate_id, "Deleting Durable Object");
                match self.storage.delete_all().await {
                    Ok(_) => {
                        info!("Successfully deleted durable object storage");
                        Ok(Response::empty()?.with_status(200))
                    }
                    Err(err) => {
                        error!("Failed to delete durable object storage: {err}");
                        Err(anyhow!("Failed to delete durable object storage: {err}"))
                    }
                }
            }
        }
    }
}
