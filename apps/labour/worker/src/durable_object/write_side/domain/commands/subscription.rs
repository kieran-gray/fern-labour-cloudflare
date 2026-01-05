use fern_labour_labour_shared::value_objects::SubscriberRole;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SetSubscriptionToken {
    pub labour_id: Uuid,
    pub token: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct InvalidateSubscriptionToken {
    pub labour_id: Uuid,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ApproveSubscriber {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RemoveSubscriber {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BlockSubscriber {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UnblockSubscriber {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateSubscriberRole {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
    pub role: SubscriberRole,
}
