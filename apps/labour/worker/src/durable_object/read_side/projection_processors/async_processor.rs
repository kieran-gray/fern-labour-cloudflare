use std::rc::Rc;

use anyhow::{Result, anyhow};
use tracing::{info, warn};

use fern_labour_event_sourcing_rs::{
    CacheTrait, EventEnvelope, EventEnvelopeAdapter, EventStoreTrait, IncrementalAsyncProjector,
};

use crate::durable_object::write_side::domain::LabourEvent;

pub struct AsyncProjectionProcessor {
    event_store: Rc<dyn EventStoreTrait>,
    cache: Rc<dyn CacheTrait>,
    projectors: Vec<Box<dyn IncrementalAsyncProjector<LabourEvent>>>,
    default_batch_size: i64,
}

impl AsyncProjectionProcessor {
    pub fn create(
        event_store: Rc<dyn EventStoreTrait>,
        cache: Rc<dyn CacheTrait>,
        projectors: Vec<Box<dyn IncrementalAsyncProjector<LabourEvent>>>,
        default_batch_size: i64,
    ) -> Self {
        Self {
            event_store,
            cache,
            projectors,
            default_batch_size,
        }
    }

    fn get_min_cached_sequence(&self) -> i64 {
        self.projectors
            .iter()
            .map(|p| p.get_cached_sequence(&self.cache))
            .min()
            .unwrap_or(0)
    }

    pub async fn process_projections(&self) -> Result<()> {
        let Some(max_sequence) = self.event_store.max_sequence()? else {
            return Ok(());
        };

        let min_cached_sequence = self.get_min_cached_sequence();

        if min_cached_sequence >= max_sequence {
            return Ok(());
        }

        let events: Vec<EventEnvelope<LabourEvent>> = self
            .event_store
            .events_since(min_cached_sequence, self.default_batch_size)
            .map_err(|e| anyhow!("Failed to fetch events since checkpoint: {e}"))?
            .into_iter()
            .map(|stored| stored.to_envelope())
            .collect::<Result<Vec<_>>>()?;

        if events.is_empty() {
            return Ok(());
        }

        for projector in &self.projectors {
            if let Err(e) = projector.process(&self.cache, &events, max_sequence).await {
                warn!(projector = %projector.name(), error = %e, "Failed to process projector");
                anyhow::bail!("Failed to process projector {}: {}", projector.name(), e);
            }
        }
        info!("Async projection processing completed");
        Ok(())
    }
}
