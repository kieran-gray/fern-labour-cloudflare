use fern_labour_event_sourcing_rs::{Event, impl_event};
use fern_labour_labour_shared::value_objects::{
    SubscriberAccessLevel, SubscriberContactMethod, SubscriberRole,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberRequested {
    pub labour_id: Uuid,
    pub subscriber_name: String,
    pub subscriber_id: String,
    pub subscription_id: Uuid,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberUnsubscribed {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberNotificationMethodsUpdated {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
    pub notification_methods: Vec<SubscriberContactMethod>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberAccessLevelUpdated {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
    pub access_level: SubscriberAccessLevel,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberApproved {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberRemoved {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberBlocked {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberUnblocked {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SubscriberRoleUpdated {
    pub labour_id: Uuid,
    pub subscription_id: Uuid,
    pub role: SubscriberRole,
}

impl_event!(SubscriberRequested, labour_id);
impl_event!(SubscriberUnsubscribed, labour_id);
impl_event!(SubscriberNotificationMethodsUpdated, labour_id);
impl_event!(SubscriberAccessLevelUpdated, labour_id);
impl_event!(SubscriberApproved, labour_id);
impl_event!(SubscriberRemoved, labour_id);
impl_event!(SubscriberBlocked, labour_id);
impl_event!(SubscriberUnblocked, labour_id);
impl_event!(SubscriberRoleUpdated, labour_id);
