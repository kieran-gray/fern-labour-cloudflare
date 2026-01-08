use std::collections::HashMap;
use std::rc::Rc;

use anyhow::{Context, Result, anyhow};
use chrono::Utc;
use tracing::{debug, error, warn};

use fern_labour_event_sourcing_rs::{
    CheckpointRepository, CheckpointStatus, EventEnvelopeAdapter, EventStoreTrait,
    ProjectionCheckpoint, SyncProjector,
};

use crate::durable_object::write_side::domain::LabourEvent;

const MAX_PROJECTOR_ERROR_COUNT: i64 = 5;

pub struct SyncProjectionProcessor {
    event_store: Rc<dyn EventStoreTrait>,
    checkpoint_repository: Box<dyn CheckpointRepository>,
    projectors: HashMap<String, Box<dyn SyncProjector<LabourEvent>>>,
    batch_size: i64,
}

impl SyncProjectionProcessor {
    pub fn create(
        event_store: Rc<dyn EventStoreTrait>,
        checkpoint_repository: Box<dyn CheckpointRepository>,
        projectors: Vec<Box<dyn SyncProjector<LabourEvent>>>,
        default_batch_size: i64,
    ) -> Self {
        let projector_map: HashMap<String, Box<dyn SyncProjector<LabourEvent>>> = projectors
            .into_iter()
            .map(|proj| (proj.name().to_string(), proj))
            .collect();

        Self {
            event_store,
            checkpoint_repository,
            projectors: projector_map,
            batch_size: default_batch_size,
        }
    }

    pub fn process_projections(&self) -> Result<()> {
        debug!("Starting checkpoint-based projection processing");

        let mut errors: Vec<String> = Vec::new();

        for (projector_name, projector) in &self.projectors {
            if let Ok(Some(checkpoint)) = self.checkpoint_repository.get_checkpoint(projector_name)
                && checkpoint.status == CheckpointStatus::Error
                && checkpoint.error_count >= MAX_PROJECTOR_ERROR_COUNT
            {
                warn!(
                    projector = %projector_name,
                    error_count = checkpoint.error_count,
                    "Skipping faulted projector - exceeded max error count. Manual reset required."
                );
                continue;
            }

            if let Err(e) = self.process_single_projector(projector_name, projector.as_ref()) {
                error!(projector = %projector_name, error = %e, "Failed to process projector");
                errors.push(format!("{}: {}", projector_name, e));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(anyhow!(
                "One or more projectors failed: {}",
                errors.join("; ")
            ))
        }
    }

    fn process_single_projector(
        &self,
        projector_name: &str,
        projector: &dyn SyncProjector<LabourEvent>,
    ) -> Result<()> {
        let checkpoint = self
            .checkpoint_repository
            .get_checkpoint(projector_name)?
            .unwrap_or_else(|| self.create_initial_checkpoint(projector_name));

        let last_sequence = checkpoint.last_processed_sequence;

        debug!(
            projector = %projector_name,
            last_sequence = last_sequence,
            "Processing projector from checkpoint"
        );

        let stored_events = self
            .event_store
            .events_since(last_sequence, self.batch_size)
            .context("Failed to fetch events since checkpoint")?;

        if stored_events.is_empty() {
            debug!(
                projector = %projector_name,
                "No new events to process"
            );
            return Ok(());
        }

        let envelopes = stored_events
            .iter()
            .map(|stored| stored.to_envelope())
            .collect::<Result<Vec<_>>>()?;

        let event_count = envelopes.len();
        debug!(
            projector = %projector_name,
            event_count = event_count,
            "Processing events"
        );

        if let Err(err) = projector.project_batch(&envelopes) {
            let new_error_count = checkpoint.error_count + 1;
            let error_checkpoint = ProjectionCheckpoint {
                projector_name: projector_name.to_string(),
                last_processed_sequence: checkpoint.last_processed_sequence,
                last_processed_at: checkpoint.last_processed_at,
                updated_at: Utc::now(),
                status: CheckpointStatus::Error,
                error_message: Some(err.to_string()),
                error_count: new_error_count,
            };

            if let Err(update_err) = self
                .checkpoint_repository
                .update_checkpoint(&error_checkpoint)
            {
                error!(
                    projector = %projector_name,
                    error = %update_err,
                    "Failed to update checkpoint with error state"
                );
            }

            return Err(anyhow!(
                "Projector {projector_name} failed to process batch (attempt {}): {err}",
                new_error_count
            ));
        }

        let last_envelope = envelopes.last().unwrap();
        let new_checkpoint = ProjectionCheckpoint {
            projector_name: projector_name.to_string(),
            last_processed_sequence: last_envelope.metadata.sequence,
            last_processed_at: last_envelope.metadata.timestamp,
            updated_at: chrono::Utc::now(),
            status: CheckpointStatus::Healthy,
            error_message: None,
            error_count: 0,
        };

        self.checkpoint_repository
            .update_checkpoint(&new_checkpoint)
            .context("Failed to update checkpoint")?;

        debug!(
            projector = %projector_name,
            events_processed = event_count,
            new_sequence = new_checkpoint.last_processed_sequence,
            "Successfully processed and checkpointed events"
        );

        Ok(())
    }

    fn create_initial_checkpoint(&self, projector_name: &str) -> ProjectionCheckpoint {
        ProjectionCheckpoint {
            projector_name: projector_name.to_string(),
            last_processed_sequence: 0,
            last_processed_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            status: CheckpointStatus::Healthy,
            error_message: None,
            error_count: 0,
        }
    }

    pub fn get_last_processed_sequence(&self) -> i64 {
        self.projectors
            .keys()
            .filter_map(|projector_name| {
                self.checkpoint_repository
                    .get_checkpoint(projector_name)
                    .ok()
                    .flatten()
                    .and_then(|cp| {
                        if cp.status == CheckpointStatus::Error
                            && cp.error_count >= MAX_PROJECTOR_ERROR_COUNT
                        {
                            None
                        } else {
                            Some(cp.last_processed_sequence)
                        }
                    })
            })
            .min()
            .unwrap_or(0)
    }

    pub fn has_unprocessed_events(&self) -> bool {
        let last_processed = self.get_last_processed_sequence();
        self.event_store
            .events_since(last_processed, 1)
            .map(|events| !events.is_empty())
            .unwrap_or(false)
    }
}
