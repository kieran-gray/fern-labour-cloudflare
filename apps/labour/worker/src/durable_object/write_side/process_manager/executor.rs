use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use fern_labour_labour_shared::value_objects::SubscriberContactMethod;
use fern_labour_notifications_shared::{
    service_clients::notification::NotificationClient,
    value_objects::{
        NotificationChannel, NotificationPriority,
        notification_template_data::NotificationTemplateData,
    },
};
use fern_labour_workers_shared::User;
use std::rc::Rc;

use crate::durable_object::write_side::{
    application::command_processors::LabourCommandProcessor,
    domain::{LabourCommand, commands::subscription::SetSubscriptionToken},
    infrastructure::{SubscriptionTokenGenerator, UserStore},
    process_manager::types::*,
};

#[async_trait(?Send)]
pub trait EffectExecutor {
    async fn execute(&self, effect: &Effect) -> Result<()>;
}

pub struct LabourEffectExecutor {
    user_storage: UserStore,
    notification_client: Box<dyn NotificationClient>,
    command_processor: Rc<LabourCommandProcessor>,
    token_generator: Box<dyn SubscriptionTokenGenerator>,
    web_app_url: String,
}

impl LabourEffectExecutor {
    pub fn new(
        user_storage: UserStore,
        notification_client: Box<dyn NotificationClient>,
        command_processor: Rc<LabourCommandProcessor>,
        token_generator: Box<dyn SubscriptionTokenGenerator>,
        web_app_url: String,
    ) -> Self {
        Self {
            user_storage,
            notification_client,
            command_processor,
            token_generator,
            web_app_url,
        }
    }

    fn get_user(&self, user_id: &str) -> Result<User> {
        self.user_storage
            .get_user(user_id)?
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("user not found: {user_id}"))
    }

    fn extract_first_name(full_name: &str) -> String {
        full_name
            .split_whitespace()
            .next()
            .unwrap_or(full_name)
            .to_string()
    }

    fn channel_to_notification_channel(channel: &SubscriberContactMethod) -> NotificationChannel {
        match channel {
            SubscriberContactMethod::EMAIL => NotificationChannel::EMAIL,
            SubscriberContactMethod::SMS => NotificationChannel::SMS,
            SubscriberContactMethod::WHATSAPP => NotificationChannel::WHATSAPP,
        }
    }

    fn get_user_destination(user: &User, channel: &SubscriberContactMethod) -> Result<String> {
        match channel {
            SubscriberContactMethod::EMAIL => user
                .email
                .clone()
                .ok_or_else(|| anyhow!("user {} has no email", user.user_id)),
            SubscriberContactMethod::SMS | SubscriberContactMethod::WHATSAPP => user
                .phone_number
                .clone()
                .ok_or_else(|| anyhow!("user {} has no phone number", user.user_id)),
        }
    }

    async fn send_notification(&self, intent: &NotificationIntent) -> Result<()> {
        match &intent.context {
            NotificationContext::Subscriber {
                recipient_user_id,
                channel,
                sender_id,
                notification,
                ..
            } => {
                self.send_subscriber_notification(
                    recipient_user_id,
                    channel,
                    sender_id,
                    notification,
                )
                .await
            }
            NotificationContext::Mother {
                recipient_user_id,
                channel,
                notification,
            } => {
                self.send_labour_owner_notification(recipient_user_id, channel, notification)
                    .await
            }
            NotificationContext::Email {
                email,
                sender_id,
                notification,
            } => {
                self.send_email_notification(email, sender_id, notification)
                    .await
            }
        }
    }

    async fn send_subscriber_notification(
        &self,
        recipient_user_id: &str,
        channel: &SubscriberContactMethod,
        sender_id: &str,
        notification: &SubscriberNotification,
    ) -> Result<()> {
        let recipient = self.get_user(recipient_user_id)?;
        let sender = self.get_user(sender_id)?;

        let destination = Self::get_user_destination(&recipient, channel)?;

        let recipient_first_name = recipient
            .first_name
            .or(recipient.name)
            .unwrap_or_else(|| "there".to_string());

        let sender_name = sender.name.clone().unwrap_or_else(|| "Unknown".to_string());
        let sender_first_name = sender
            .first_name
            .unwrap_or_else(|| Self::extract_first_name(&sender_name));

        let template_data = match notification {
            SubscriberNotification::LabourBegun { .. } => {
                NotificationTemplateData::LabourBegunData {
                    birthing_person_name: sender_name,
                    birthing_person_first_name: sender_first_name,
                    subscriber_first_name: recipient_first_name,
                    link: self.web_app_url.clone(),
                }
            }
            SubscriberNotification::LabourCompleted { notes, .. } => {
                if let Some(notes) = notes {
                    NotificationTemplateData::LabourCompletedWithNoteData {
                        birthing_person_name: sender_name,
                        birthing_person_first_name: sender_first_name,
                        subscriber_first_name: recipient_first_name,
                        update: notes.clone(),
                        link: self.web_app_url.clone(),
                    }
                } else {
                    NotificationTemplateData::LabourCompletedData {
                        birthing_person_name: sender_name,
                        birthing_person_first_name: sender_first_name,
                        subscriber_first_name: recipient_first_name,
                        link: self.web_app_url.clone(),
                    }
                }
            }
            SubscriberNotification::AnnouncementPosted { message, .. } => {
                NotificationTemplateData::LabourAnnouncementData {
                    birthing_person_name: sender_name,
                    birthing_person_first_name: sender_first_name,
                    subscriber_first_name: recipient_first_name,
                    announcement: message.clone(),
                    link: self.web_app_url.clone(),
                }
            }
            SubscriberNotification::SubscriptionApproved { .. } => {
                NotificationTemplateData::SubscriberApprovedData {
                    subscriber_first_name: recipient_first_name,
                    birthing_person_name: sender_name,
                    link: self.web_app_url.clone(),
                }
            }
        };

        self.notification_client
            .request_notification(
                Self::channel_to_notification_channel(channel),
                destination,
                template_data,
                None,
                NotificationPriority::default(),
            )
            .await
            .map_err(|e| anyhow!(e.to_string()))
    }

    async fn send_labour_owner_notification(
        &self,
        recipient_user_id: &str,
        channel: &SubscriberContactMethod,
        notification: &MotherNotification,
    ) -> Result<()> {
        let recipient = self.get_user(recipient_user_id)?;
        let destination = Self::get_user_destination(&recipient, channel)?;

        let recipient_first_name = recipient
            .first_name
            .or(recipient.name)
            .unwrap_or_else(|| "there".to_string());

        let template_data = match notification {
            MotherNotification::SubscriberRequested {
                requester_user_id, ..
            } => {
                let requester = self.get_user(requester_user_id)?;
                let requester_name = requester.name.unwrap_or_else(|| "Someone".to_string());

                NotificationTemplateData::SubscriberRequestedData {
                    birthing_person_first_name: recipient_first_name,
                    subscriber_name: requester_name,
                    link: self.web_app_url.clone(),
                }
            }
        };

        self.notification_client
            .request_notification(
                Self::channel_to_notification_channel(channel),
                destination,
                template_data,
                None,
                NotificationPriority::default(),
            )
            .await
            .map_err(|e| anyhow!(e.to_string()))
    }

    async fn send_email_notification(
        &self,
        email: &str,
        sender_id: &str,
        notification: &EmailNotification,
    ) -> Result<()> {
        let sender = self.get_user(sender_id)?;
        let sender_name = sender.name.clone().unwrap_or_else(|| "Unknown".to_string());
        let sender_first_name = sender
            .first_name
            .unwrap_or_else(|| Self::extract_first_name(&sender_name));

        let template_data = match notification {
            EmailNotification::LabourInvite { .. } => NotificationTemplateData::LabourInviteData {
                birthing_person_name: sender_name,
                birthing_person_first_name: sender_first_name,
                link: self.web_app_url.clone(),
            },
        };

        self.notification_client
            .request_notification(
                NotificationChannel::EMAIL,
                email.to_string(),
                template_data,
                None,
                NotificationPriority::default(),
            )
            .await
            .map_err(|e| anyhow!(e.to_string()))
    }
}

#[async_trait(?Send)]
impl EffectExecutor for LabourEffectExecutor {
    async fn execute(&self, effect: &Effect) -> Result<()> {
        match effect {
            Effect::SendNotification(intent) => self.send_notification(intent).await,
            Effect::IssueCommand { command, .. } => {
                let system_user = User::internal("process-manager");
                self.command_processor
                    .handle_command(command.clone(), system_user)
                    .context("Failed to handle internal command")?;
                Ok(())
            }
            Effect::GenerateSubscriptionToken { labour_id, .. } => {
                let token = self.token_generator.generate();
                let command = LabourCommand::SetSubscriptionToken(SetSubscriptionToken {
                    labour_id: *labour_id,
                    token,
                });
                let system_user = User::internal("process-manager");
                self.command_processor
                    .handle_command(command, system_user)
                    .context("Failed to handle internal command")?;
                Ok(())
            }
        }
    }
}
