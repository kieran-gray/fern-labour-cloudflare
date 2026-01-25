use std::{collections::HashMap, str::FromStr};

use anyhow::{Context, Result};
use fern_labour_notifications_shared::{
    PublicCommand,
    value_objects::{
        NotificationChannel, NotificationDestination, NotificationTemplateData, RenderedContent,
    },
};
use serde::{Deserialize, Serialize};
use strum::VariantNames;
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum NotificationCommand {
    RequestNotification {
        notification_id: Uuid,
        channel: NotificationChannel,
        destination: NotificationDestination,
        template_data: NotificationTemplateData,
        metadata: Option<HashMap<String, String>>,
    },
    StoreRenderedContent {
        notification_id: Uuid,
        rendered_content: RenderedContent,
    },
    MarkAsDispatched {
        notification_id: Uuid,
        external_id: Option<String>,
        sent_via_provider: String,
    },
    MarkAsDelivered {
        notification_id: Uuid,
        provider: String,
    },
    MarkAsFailed {
        notification_id: Uuid,
        reason: Option<String>,
        provider: String,
    },
    MarkContentRedacted {
        notification_id: Uuid,
    },
    DeleteNotification {
        notification_id: Uuid,
    },
}

impl TryFrom<(PublicCommand, Uuid)> for NotificationCommand {
    type Error = anyhow::Error;
    fn try_from((command, notification_id): (PublicCommand, Uuid)) -> Result<Self> {
        match command {
            PublicCommand::RequestNotification {
                channel,
                destination,
                template_data,
                metadata,
            } => {
                let channel = NotificationChannel::from_str(&channel).with_context(|| {
                    format!(
                        "Invalid notification channel: '{}'. Valid channels are: {}",
                        channel,
                        NotificationChannel::VARIANTS.join(", ")
                    )
                })?;

                let destination =
                    NotificationDestination::from_string_and_channel(destination.clone(), &channel)
                        .with_context(|| {
                            format!(
                                "Invalid destination '{}' for channel '{}'. Expected format: {}",
                                destination,
                                channel,
                                match channel {
                                    NotificationChannel::EMAIL => "valid email address",
                                    NotificationChannel::SMS => "valid phone number (E.164 format)",
                                    NotificationChannel::WHATSAPP =>
                                        "valid phone number (E.164 format)",
                                }
                            )
                        })?;
                Ok(NotificationCommand::RequestNotification {
                    notification_id,
                    channel,
                    destination,
                    template_data,
                    metadata,
                })
            }
        }
    }
}
