use std::rc::Rc;

use fern_labour_event_sourcing_rs::{Aggregate, AggregateRepositoryTrait};
use fern_labour_workers_shared::User;

use crate::durable_object::{
    authorization::{Action, Authorizer, resolve_principal},
    exceptions::AppError,
    write_side::domain::{Labour, LabourCommand},
};

#[derive(Clone)]
pub struct LabourCommandProcessor {
    repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
    authorizer: Authorizer,
}

impl LabourCommandProcessor {
    pub fn new(repository: Rc<dyn AggregateRepositoryTrait<Labour>>) -> Self {
        Self {
            repository,
            authorizer: Authorizer::new(),
        }
    }

    pub fn handle_command(&self, command: LabourCommand, user: User) -> Result<(), AppError> {
        let aggregate = self.repository.load()?;

        let principal = resolve_principal(&user, aggregate.as_ref());
        let action = Action::Command(command.clone());

        self.authorizer
            .authorize(&principal, &action, aggregate.as_ref())?;

        let events = Labour::handle_command(aggregate.as_ref(), command)?;

        if events.is_empty() {
            return Ok(());
        }

        let updated_aggregate = match aggregate {
            Some(mut labour) => {
                for event in &events {
                    labour.apply(event);
                }
                Some(labour)
            }
            None => Labour::from_events(&events),
        };

        self.repository
            .save(updated_aggregate.as_ref(), &events, user.user_id)?;

        Ok(())
    }
}
