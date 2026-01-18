use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    AdminCommand, ContractionCommand, LabourCommand, LabourUpdateCommand, SubscriberCommand,
    SubscriptionCommand, commands::checkout::CheckoutCommand,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum ApiCommand {
    Admin(AdminCommand),
    Contraction(ContractionCommand),
    Labour(LabourCommand),
    LabourUpdate(LabourUpdateCommand),
    Subscriber(SubscriberCommand),
    Subscription(SubscriptionCommand),
    Checkout(CheckoutCommand),
}

impl ApiCommand {
    pub fn labour_id(&self) -> Uuid {
        match self {
            Self::Admin(cmd) => cmd.labour_id(),
            Self::Contraction(cmd) => cmd.labour_id(),
            Self::Labour(cmd) => cmd.labour_id(),
            Self::LabourUpdate(cmd) => cmd.labour_id(),
            Self::Subscriber(cmd) => cmd.labour_id(),
            Self::Subscription(cmd) => cmd.labour_id(),
            Self::Checkout(cmd) => cmd.labour_id(),
        }
    }
}
