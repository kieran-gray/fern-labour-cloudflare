use std::rc::Rc;

use fern_labour_event_sourcing_rs::{AggregateRepositoryTrait, EventEnvelope};

use crate::durable_object::{
    exceptions::AppError,
    write_side::domain::{Labour, LabourEvent},
};

pub struct EventQuery {
    aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
}

impl EventQuery {
    pub fn new(aggregate_repository: Rc<dyn AggregateRepositoryTrait<Labour>>) -> Self {
        Self {
            aggregate_repository,
        }
    }

    pub fn get_event_stream(&self) -> Result<Vec<EventEnvelope<LabourEvent>>, AppError> {
        let events = self.aggregate_repository.load_events()?;
        Ok(events)
    }
}
