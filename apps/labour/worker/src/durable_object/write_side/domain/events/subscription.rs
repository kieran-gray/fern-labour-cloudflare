use fern_labour_event_sourcing_rs::{Event, impl_event};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriptionTokenSet {
    pub labour_id: Uuid,
    pub token: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriptionTokenInvalidated {
    pub labour_id: Uuid,
}

impl_event!(SubscriptionTokenSet, labour_id);
impl_event!(SubscriptionTokenInvalidated, labour_id);
