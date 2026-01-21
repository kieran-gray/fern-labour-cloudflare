use fern_labour_labour_shared::value_objects::{SubscriberAccessLevel, SubscriberContactMethod};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RequestAccess {
    pub labour_id: Uuid,
    pub subscriber_name: String,
    pub subscriber_id: String,
    pub token: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Unsubscribe {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateNotificationMethods {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
    pub notification_methods: Vec<SubscriberContactMethod>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateAccessLevel {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
    pub access_level: SubscriberAccessLevel,
}
