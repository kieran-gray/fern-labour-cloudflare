use anyhow::{Result, anyhow};
use fern_labour_event_sourcing_rs::CheckpointRepository;
use fern_labour_labour_shared::AdminCommand;
use tracing::{error, info};
use worker::{Response, Storage};

pub struct AdminCommandProcessor {
    checkpoint_repository: Box<dyn CheckpointRepository>,
    storage: Storage,
}

impl AdminCommandProcessor {
    pub fn create(checkpoint_repository: Box<dyn CheckpointRepository>, storage: Storage) -> Self {
        Self {
            checkpoint_repository,
            storage,
        }
    }

    pub async fn handle(&self, command: AdminCommand) -> Result<Response> {
        match command {
            AdminCommand::RebuildReadModels { aggregate_id } => {
                info!(
                    aggregate_id = %aggregate_id,
                    "Rebuilding read models"
                );
                let result = self
                    .checkpoint_repository
                    .get_all_checkpoints()?
                    .iter()
                    .map(|c| {
                        self.checkpoint_repository
                            .reset_checkpoint(&c.projector_name)
                    })
                    .all(|r| r.is_ok());

                match result {
                    true => Ok(Response::empty()?.with_status(204)),
                    false => Err(anyhow!("Failed to reset checkpoints")),
                }
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
