pub mod contraction;
pub mod labour;
pub mod labour_update;
pub mod subscriber;
pub mod subscription;

use chrono::Utc;
use fern_labour_labour_shared::{
    ContractionCommand, LabourUpdateCommand, SubscriberCommand, SubscriptionCommand,
    commands::labour::LabourCommand as LabourApiCommand,
};
use serde::{Deserialize, Serialize};

use contraction::{DeleteContraction, EndContraction, StartContraction, UpdateContraction};
use labour::{
    BeginLabour, CompleteLabour, DeleteLabour, PlanLabour, SendLabourInvite, UpdateLabourPlan,
};
use labour_update::{
    DeleteLabourUpdate, PostApplicationLabourUpdate, PostLabourUpdate, UpdateLabourUpdateMessage,
    UpdateLabourUpdateType,
};
use subscriber::{RequestAccess, Unsubscribe, UpdateAccessLevel, UpdateNotificationMethods};
use subscription::{
    ApproveSubscriber, BlockSubscriber, RemoveSubscriber, SetSubscriptionToken, UnblockSubscriber,
    UpdateSubscriberRole,
};

use crate::durable_object::write_side::domain::commands::{
    labour::AdvanceLabourPhase, subscription::InvalidateSubscriptionToken,
};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum LabourCommand {
    PlanLabour(PlanLabour),
    UpdateLabourPlan(UpdateLabourPlan),
    BeginLabour(BeginLabour),
    CompleteLabour(CompleteLabour),
    SendLabourInvite(SendLabourInvite),
    DeleteLabour(DeleteLabour),
    AdvanceLabourPhase(AdvanceLabourPhase),
    // Contraction Commands
    StartContraction(StartContraction),
    EndContraction(EndContraction),
    UpdateContraction(UpdateContraction),
    DeleteContraction(DeleteContraction),
    // Labour Update Commands
    PostLabourUpdate(PostLabourUpdate),
    PostApplicationLabourUpdate(PostApplicationLabourUpdate),
    UpdateLabourUpdateMessage(UpdateLabourUpdateMessage),
    UpdateLabourUpdateType(UpdateLabourUpdateType),
    DeleteLabourUpdate(DeleteLabourUpdate),
    // Subscriber Commands
    RequestAccess(RequestAccess),
    Unsubscribe(Unsubscribe),
    UpdateNotificationMethods(UpdateNotificationMethods),
    UpdateAccessLevel(UpdateAccessLevel),
    // Subscription Commands
    SetSubscriptionToken(SetSubscriptionToken),
    InvalidateSubscriptionToken(InvalidateSubscriptionToken),
    ApproveSubscriber(ApproveSubscriber),
    RemoveSubscriber(RemoveSubscriber),
    BlockSubscriber(BlockSubscriber),
    UnblockSubscriber(UnblockSubscriber),
    UpdateSubscriberRole(UpdateSubscriberRole),
}

impl From<LabourApiCommand> for LabourCommand {
    fn from(cmd: LabourApiCommand) -> Self {
        match cmd {
            LabourApiCommand::PlanLabour {
                labour_id,
                mother_id,
                mother_name,
                first_labour,
                due_date,
                labour_name,
            } => LabourCommand::PlanLabour(PlanLabour {
                labour_id,
                mother_id,
                mother_name,
                first_labour,
                due_date,
                labour_name,
            }),
            LabourApiCommand::UpdateLabourPlan {
                labour_id,
                first_labour,
                due_date,
                labour_name,
            } => LabourCommand::UpdateLabourPlan(UpdateLabourPlan {
                labour_id,
                first_labour,
                due_date,
                labour_name,
            }),
            LabourApiCommand::BeginLabour { labour_id } => {
                LabourCommand::BeginLabour(BeginLabour { labour_id })
            }
            LabourApiCommand::CompleteLabour { labour_id, notes } => {
                LabourCommand::CompleteLabour(CompleteLabour { labour_id, notes })
            }
            LabourApiCommand::SendLabourInvite {
                labour_id,
                invite_email,
            } => LabourCommand::SendLabourInvite(SendLabourInvite {
                labour_id,
                invite_email,
            }),
            LabourApiCommand::DeleteLabour { labour_id } => {
                LabourCommand::DeleteLabour(DeleteLabour { labour_id })
            }
        }
    }
}

impl From<ContractionCommand> for LabourCommand {
    fn from(cmd: ContractionCommand) -> Self {
        match cmd {
            ContractionCommand::StartContraction {
                labour_id,
                start_time,
                contraction_id,
            } => {
                let datetime = match start_time {
                    Some(datetime) => datetime,
                    None => Utc::now(),
                };

                LabourCommand::StartContraction(StartContraction {
                    labour_id,
                    contraction_id,
                    start_time: datetime,
                })
            },
            ContractionCommand::EndContraction {
                labour_id,
                contraction_id,
                end_time,
                intensity,
            } => {
                let datetime = match end_time {
                    Some(datetime) => datetime,
                    None => Utc::now(),
                };

                LabourCommand::EndContraction(EndContraction {
                    labour_id,
                    contraction_id,
                    end_time: datetime,
                    intensity,
                })
            },
            ContractionCommand::UpdateContraction {
                labour_id,
                contraction_id,
                start_time,
                end_time,
                intensity,
            } => LabourCommand::UpdateContraction(UpdateContraction {
                labour_id,
                contraction_id,
                start_time,
                end_time,
                intensity,
            }),
            ContractionCommand::DeleteContraction {
                labour_id,
                contraction_id,
            } => LabourCommand::DeleteContraction(DeleteContraction {
                labour_id,
                contraction_id,
            }),
        }
    }
}

impl From<LabourUpdateCommand> for LabourCommand {
    fn from(cmd: LabourUpdateCommand) -> Self {
        match cmd {
            LabourUpdateCommand::PostLabourUpdate {
                labour_id,
                labour_update_type,
                message,
            } => LabourCommand::PostLabourUpdate(PostLabourUpdate {
                labour_id,
                labour_update_type,
                message,
            }),
            LabourUpdateCommand::UpdateLabourUpdateMessage {
                labour_id,
                labour_update_id,
                message,
            } => LabourCommand::UpdateLabourUpdateMessage(UpdateLabourUpdateMessage {
                labour_id,
                labour_update_id,
                message,
            }),
            LabourUpdateCommand::UpdateLabourUpdateType {
                labour_id,
                labour_update_id,
                labour_update_type,
            } => LabourCommand::UpdateLabourUpdateType(UpdateLabourUpdateType {
                labour_id,
                labour_update_id,
                labour_update_type,
            }),
            LabourUpdateCommand::DeleteLabourUpdate {
                labour_id,
                labour_update_id,
            } => LabourCommand::DeleteLabourUpdate(DeleteLabourUpdate {
                labour_id,
                labour_update_id,
            }),
        }
    }
}

impl From<(SubscriberCommand, String)> for LabourCommand {
    fn from((cmd, subscriber_id): (SubscriberCommand, String)) -> Self {
        match cmd {
            SubscriberCommand::RequestAccess { labour_id, token } => {
                LabourCommand::RequestAccess(RequestAccess {
                    labour_id,
                    subscriber_id,
                    token,
                })
            }
            SubscriberCommand::Unsubscribe {
                labour_id,
                subscription_id,
            } => LabourCommand::Unsubscribe(Unsubscribe {
                labour_id,
                subscription_id,
            }),
            SubscriberCommand::UpdateAccessLevel {
                labour_id,
                access_level,
                subscription_id,
            } => LabourCommand::UpdateAccessLevel(UpdateAccessLevel {
                labour_id,
                subscription_id,
                access_level,
            }),
            SubscriberCommand::UpdateNotificationMethods {
                labour_id,
                subscription_id,
                notification_methods,
            } => LabourCommand::UpdateNotificationMethods(UpdateNotificationMethods {
                labour_id,
                subscription_id,
                notification_methods,
            }),
        }
    }
}

impl From<SubscriptionCommand> for LabourCommand {
    fn from(cmd: SubscriptionCommand) -> Self {
        match cmd {
            SubscriptionCommand::ApproveSubscriber {
                labour_id,
                subscription_id,
            } => LabourCommand::ApproveSubscriber(ApproveSubscriber {
                labour_id,
                subscription_id,
            }),
            SubscriptionCommand::BlockSubscriber {
                labour_id,
                subscription_id,
            } => LabourCommand::BlockSubscriber(BlockSubscriber {
                labour_id,
                subscription_id,
            }),
            SubscriptionCommand::RemoveSubscriber {
                labour_id,
                subscription_id,
            } => LabourCommand::RemoveSubscriber(RemoveSubscriber {
                labour_id,
                subscription_id,
            }),
            SubscriptionCommand::UnblockSubscriber {
                labour_id,
                subscription_id,
            } => LabourCommand::UnblockSubscriber(UnblockSubscriber {
                labour_id,
                subscription_id,
            }),
            SubscriptionCommand::UpdateSubscriberRole {
                labour_id,
                subscription_id,
                role,
            } => LabourCommand::UpdateSubscriberRole(UpdateSubscriberRole {
                labour_id,
                subscription_id,
                role,
            }),
            SubscriptionCommand::InvalidateSubscriptionToken { labour_id } => {
                LabourCommand::InvalidateSubscriptionToken(InvalidateSubscriptionToken {
                    labour_id,
                })
            }
        }
    }
}
