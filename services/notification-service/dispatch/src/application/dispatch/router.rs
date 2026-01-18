use std::collections::HashMap;

use crate::application::{dispatch::DispatchContext, dispatch::NotificationGatewayTrait};
use anyhow::{Context, Result, anyhow};
use fern_labour_notifications_shared::value_objects::NotificationChannel;

pub struct NotificationRouter {
    gateways: HashMap<NotificationChannel, Box<dyn NotificationGatewayTrait>>,
}

impl NotificationRouter {
    pub fn create(gateways: Vec<Box<dyn NotificationGatewayTrait>>) -> Self {
        let mut gateways_map = HashMap::new();

        for gateway in gateways {
            gateways_map.insert(gateway.channel(), gateway);
        }
        Self {
            gateways: gateways_map,
        }
    }

    pub async fn dispatch(&self, context: DispatchContext) -> Result<Option<String>> {
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
}
