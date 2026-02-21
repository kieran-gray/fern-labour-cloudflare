use std::{collections::HashMap, rc::Rc};

use crate::application::dispatch::{
    DispatchContext, NotificationGatewayTrait, ScheduleContext, gateway::DispatchResult,
    gateway::ScheduleResult,
};
use anyhow::{Result, anyhow};
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
        context.validate().map_err(|e| anyhow!(e.to_string()))?;
        let gateway = self.gateway_for_channel(context.channel())?;
        gateway.dispatch(&context).await
    }

    pub async fn schedule(&self, context: ScheduleContext) -> Result<ScheduleResult> {
        context.validate().map_err(|e| anyhow!(e.to_string()))?;
        let gateway = self.gateway_for_channel(context.channel())?;
        gateway.schedule(&context).await
    }

    pub async fn redact(&self, provider: String, external_id: String) -> Result<bool> {
        let gateway = self.gateway_for_provider(&provider)?;
        gateway.redact(external_id).await
    }

    fn gateway_for_channel(
        &self,
        channel: NotificationChannel,
    ) -> Result<&Rc<dyn NotificationGatewayTrait>> {
        self.gateways.get(&channel).ok_or_else(|| {
            anyhow!(
                "No gateway found for channel: {}. Available gateways: {:?}",
                channel,
                self.gateways.keys().collect::<Vec<_>>()
            )
        })
    }

    fn gateway_for_provider(&self, provider: &str) -> Result<&Rc<dyn NotificationGatewayTrait>> {
        self.providers.get(provider).ok_or_else(|| {
            anyhow!(
                "No gateway found for provider: {}. Available gateways: {:?}",
                provider,
                self.providers.keys().collect::<Vec<_>>()
            )
        })
    }
}
