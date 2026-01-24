use std::{collections::HashMap, rc::Rc};

use crate::application::dispatch::{
    DispatchContext, NotificationGatewayTrait, gateway::DispatchResult,
};
use anyhow::{Context, Result, anyhow};
use fern_labour_notifications_shared::value_objects::NotificationChannel;

pub struct NotificationRouter {
    gateways: HashMap<NotificationChannel, Rc<dyn NotificationGatewayTrait>>,
    providers: HashMap<String, Rc<dyn NotificationGatewayTrait>>,
}

impl NotificationRouter {
    pub fn create(gateways: Vec<Rc<dyn NotificationGatewayTrait>>) -> Self {
        let count = gateways.len();
        let mut gateways_map = HashMap::with_capacity(count);
        let mut providers_map = HashMap::with_capacity(count);

        for gateway in gateways {
            gateways_map.insert(gateway.channel(), gateway.clone());
            providers_map.insert(gateway.provider().to_string(), gateway.clone());
        }
        Self {
            gateways: gateways_map,
            providers: providers_map,
        }
    }

    pub async fn dispatch(&self, context: DispatchContext) -> Result<DispatchResult> {
        context.validate().context("Invalid dispatch context")?;
        let gateway = self.gateways.get(&context.channel()).ok_or_else(|| {
            anyhow!(
                "No gateway found for channel: {}. Available gateways: {:?}",
                context.channel(),
                self.gateways.keys().collect::<Vec<_>>()
            )
        })?;
        gateway.dispatch(&context).await
    }

    pub async fn redact(&self, provider: String, external_id: String) -> Result<bool> {
        let gateway = self.providers.get(&provider).ok_or_else(|| {
            anyhow!(
                "No gateway found for provider: {}. Available gateways: {:?}",
                provider,
                self.providers.keys().collect::<Vec<_>>()
            )
        })?;
        gateway.redact(external_id).await
    }
}
