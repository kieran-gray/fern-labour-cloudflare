use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum CheckoutCommand {
    CreateCheckoutSession {
        labour_id: Uuid,
        subscription_id: Uuid,
        success_url: String,
        cancel_url: String,
    },
}

impl CheckoutCommand {
    pub fn labour_id(&self) -> Uuid {
        match self {
            CheckoutCommand::CreateCheckoutSession { labour_id, .. } => *labour_id,
        }
    }
}
