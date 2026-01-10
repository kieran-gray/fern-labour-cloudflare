use std::rc::Rc;

use anyhow::{Result, anyhow};
use fern_labour_event_sourcing_rs::AggregateRepositoryTrait;
use fern_labour_labour_shared::{
    commands::checkout::CheckoutCommand,
    value_objects::{SubscriberAccessLevel, subscriber::status::SubscriberStatus},
};
use fern_labour_workers_shared::{
    User,
    clients::{CheckoutSessionRequest, StripeClient},
};
use serde::Serialize;

use crate::durable_object::{
    authorization::{Action, Authorizer, resolve_principal},
    write_side::domain::Labour,
};

#[derive(Debug, Clone, Serialize)]
pub struct CheckoutSessionResult {
    pub url: String,
    pub session_id: String,
}

pub struct CheckoutService {
    repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
    authorizer: Authorizer,
    stripe_client: Box<dyn StripeClient>,
    stripe_price_lookup_key: String,
}

impl CheckoutService {
    pub fn new(
        repository: Rc<dyn AggregateRepositoryTrait<Labour>>,
        stripe_client: Box<dyn StripeClient>,
    ) -> Self {
        Self {
            repository,
            authorizer: Authorizer::new(),
            stripe_client,
            stripe_price_lookup_key: "upgrade_to_supporter".to_string(),
        }
    }

    pub async fn create_checkout_session(
        &self,
        command: CheckoutCommand,
        user: User,
    ) -> Result<CheckoutSessionResult> {
        let aggregate = self.repository.load()?;

        let principal = resolve_principal(&user, aggregate.as_ref());
        let action = Action::CheckoutCommand(command.clone());

        self.authorizer
            .authorize(&principal, &action, aggregate.as_ref())
            .map_err(|e| anyhow!("Authorization failed: {}", e))?;

        let Some(labour) = aggregate else {
            return Err(anyhow!("Invalid command. No aggregate found."));
        };

        match command {
            CheckoutCommand::CreateCheckoutSession {
                labour_id,
                subscription_id,
                success_url,
                cancel_url,
            } => {
                let Some(subscription) = labour.find_subscription(subscription_id) else {
                    return Err(anyhow!("No subscription found"));
                };
                if subscription.status() != &SubscriberStatus::SUBSCRIBED {
                    return Err(anyhow!("Subscriber not subscribed"));
                };
                if subscription.access_level() == &SubscriberAccessLevel::SUPPORTER {
                    return Err(anyhow!("Subscription already upgraded"));
                };

                let request = CheckoutSessionRequest {
                    success_url,
                    cancel_url,
                    price_lookup_key: self.stripe_price_lookup_key.clone(),
                    metadata: vec![
                        ("labour_id".to_string(), labour_id.to_string()),
                        ("subscription_id".to_string(), subscription_id.to_string()),
                    ],
                };

                let response = self
                    .stripe_client
                    .create_checkout_session(request)
                    .await
                    .map_err(|e| anyhow!("Stripe error: {}", e))?;

                Ok(CheckoutSessionResult {
                    url: response
                        .url
                        .ok_or_else(|| anyhow!("Missing checkout URL"))?,
                    session_id: response.id,
                })
            }
        }
    }
}
