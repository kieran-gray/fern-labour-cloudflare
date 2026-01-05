use anyhow::{Context, Result};
use std::rc::Rc;
use tracing::{error, info, warn};

use fern_labour_event_sourcing_rs::{
    AggregateRepositoryTrait, EventStoreTrait, HasPolicies, PolicyContext, StoredEvent,
};

use crate::durable_object::write_side::{
    domain::{Labour, LabourEvent},
    process_manager::{executor::EffectExecutor, ledger::EffectLedger, types::Effect},
};

pub struct ProcessManager<E: EffectExecutor> {
    ledger: EffectLedger,
    executor: E,
    event_store: Rc<dyn EventStoreTrait>,
    aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
    default_batch_size: i64,
    max_retry_attempts: i64,
}

impl<E> ProcessManager<E>
where
    E: EffectExecutor,
{
    pub fn new(
        ledger: EffectLedger,
        executor: E,
        event_store: Rc<dyn EventStoreTrait>,
        aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
        default_batch_size: i64,
        max_retry_attempts: i64,
    ) -> Self {
        Self {
            ledger,
            executor,
            event_store,
            aggregate_repository,
            default_batch_size,
            max_retry_attempts,
        }
    }

    pub fn process_new_events(&self) -> Result<()> {
        let last_sequence = self.ledger.get_last_processed_sequence()?;
        let events = self
            .event_store
            .events_since(last_sequence, self.default_batch_size)
            .context("Failed to load events since last processed sequence")?;

        if events.is_empty() {
            return Ok(());
        }

        let Ok(Some(aggregate_state)) = self.aggregate_repository.load() else {
            warn!("Failed to load aggregate state");
            return Ok(());
        };

        // TODO: think about what could happen if we are processing an event against an
        // aggregate that is more up-to-date.
        for event_row in events {
            let sequence = event_row.sequence;
            let stored = StoredEvent {
                aggregate_id: event_row.aggregate_id.clone(),
                event_type: event_row.event_type.clone(),
                event_data: event_row.event_data.clone(),
                event_version: event_row.event_version,
            };
            let event = LabourEvent::from_stored_event(stored);

            let ctx = PolicyContext::new(&aggregate_state, sequence);
            let effects = match &event {
                LabourEvent::LabourPlanned(e) => e.apply_policies(&ctx),
                LabourEvent::LabourCompleted(e) => e.apply_policies(&ctx),
                LabourEvent::LabourUpdatePosted(e) => e.apply_policies(&ctx),
                LabourEvent::SubscriberApproved(e) => e.apply_policies(&ctx),
                LabourEvent::SubscriberRequested(e) => e.apply_policies(&ctx),
                LabourEvent::LabourInviteSent(e) => e.apply_policies(&ctx),
                LabourEvent::LabourUpdateTypeUpdated(e) => e.apply_policies(&ctx),
                LabourEvent::SubscriptionTokenInvalidated(e) => e.apply_policies(&ctx),
                _ => vec![],
            };

            if !effects.is_empty() {
                info!(
                    "Process manager determined {} effect(s) for event sequence {}",
                    effects.len(),
                    sequence
                );
            }

            self.ledger
                .persist_effects(&effects, sequence)
                .context("Failed to persist effects")?;
        }

        Ok(())
    }

    pub async fn dispatch_pending_effects(&self) -> Result<()> {
        let pending = self
            .ledger
            .get_pending_effects(self.max_retry_attempts)
            .context("Failed to get pending effects")?;

        if pending.is_empty() {
            return Ok(());
        }

        info!(
            "Process manager dispatching {} pending effect(s)",
            pending.len()
        );

        let mut had_failure = false;

        for record in pending {
            self.ledger
                .mark_dispatched(&record.effect_id)
                .context("Failed to mark effect as dispatched")?;

            let effect: Effect = serde_json::from_str(&record.effect_payload)
                .context("Failed to deserialize effect")?;

            match self.executor.execute(&effect).await {
                Ok(()) => {
                    self.ledger
                        .mark_completed(&record.effect_id)
                        .context("Failed to mark effect as completed")?;
                    info!("Effect {} completed successfully", record.effect_id);
                }
                Err(e) => {
                    had_failure = true;

                    let exhausted = record.attempts + 1 >= self.max_retry_attempts;
                    self.ledger
                        .mark_failed(&record.effect_id, &e.to_string(), exhausted)
                        .context("Failed to mark effect as failed")?;

                    if exhausted {
                        error!(
                            "Effect {} failed after {} attempts: {}",
                            record.effect_id, self.max_retry_attempts, e
                        );
                    } else {
                        info!(
                            "Effect {} failed (attempt {}): {}. Will retry.",
                            record.effect_id,
                            record.attempts + 1,
                            e
                        );
                    }
                }
            }
        }

        if had_failure {
            anyhow::bail!("One or more effects failed during dispatch");
        }

        Ok(())
    }

    pub async fn on_alarm(&self) -> Result<()> {
        info!("Process manager alarm triggered");
        self.process_new_events()?;
        self.dispatch_pending_effects().await
    }

    pub fn has_pending_events(&self) -> Result<bool> {
        let last_processed = self.ledger.get_last_processed_sequence()?;
        let pending_events = self
            .event_store
            .events_since(last_processed, 1)
            .map(|events| !events.is_empty())
            .unwrap_or(false);
        Ok(pending_events)
    }

    pub fn has_pending_work(&self) -> Result<bool> {
        self.ledger.has_pending_effects(self.max_retry_attempts)
    }
}
