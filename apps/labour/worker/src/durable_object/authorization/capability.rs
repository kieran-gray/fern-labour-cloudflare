use std::collections::HashSet;

use fern_labour_labour_shared::{
    commands::checkout::CheckoutCommand,
    value_objects::{SubscriberRole, subscriber::status::SubscriberStatus},
};

use crate::durable_object::{
    authorization::{Action, Principal, QueryAction},
    write_side::domain::LabourCommand,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Capability {
    AdvanceLabourPhase,
    PostApplicationLabourUpdates,
    ManageLabour,
    ExecuteLabourCommand,
    ReadLabour,
    UpdateSubscriptionAccessLevel,
    ManageOwnSubscription,
    ManageLabourSubscriptions,
    ManageSubscriptionToken,
    ReadSubscriptions,
    ReadOwnSubscription,
}

pub fn capabilities_for(principal: &Principal) -> HashSet<Capability> {
    match principal {
        Principal::Mother => HashSet::from([
            Capability::AdvanceLabourPhase,
            Capability::ManageLabour,
            Capability::ExecuteLabourCommand,
            Capability::ReadLabour,
            Capability::ManageLabourSubscriptions,
            Capability::ReadSubscriptions,
        ]),

        Principal::Subscriber { role, status, .. } => {
            if *status != SubscriberStatus::SUBSCRIBED {
                return HashSet::new();
            }

            match role {
                SubscriberRole::BIRTH_PARTNER => HashSet::from([
                    Capability::ExecuteLabourCommand,
                    Capability::ReadLabour,
                    Capability::ManageOwnSubscription,
                    Capability::ReadOwnSubscription,
                ]),
                SubscriberRole::LOVED_ONE | SubscriberRole::SUPPORT_PERSON => HashSet::from([
                    Capability::ReadLabour,
                    Capability::ManageOwnSubscription,
                    Capability::ReadOwnSubscription,
                ]),
            }
        }

        Principal::Internal => HashSet::from([
            Capability::AdvanceLabourPhase,
            Capability::PostApplicationLabourUpdates,
            Capability::ManageSubscriptionToken,
            Capability::UpdateSubscriptionAccessLevel,
        ]),

        Principal::Unassociated => HashSet::new(),
    }
}

pub fn required_capability(action: &Action) -> Capability {
    match action {
        Action::Command(cmd) => match cmd {
            LabourCommand::PlanLabour(..)
            | LabourCommand::UpdateLabourPlan(..)
            | LabourCommand::BeginLabour(..)
            | LabourCommand::CompleteLabour(..)
            | LabourCommand::DeleteLabour(..)
            | LabourCommand::SendLabourInvite(..)
            | LabourCommand::InvalidateSubscriptionToken(..) => Capability::ManageLabour,

            LabourCommand::StartContraction(..)
            | LabourCommand::EndContraction(..)
            | LabourCommand::UpdateContraction(..)
            | LabourCommand::DeleteContraction(..)
            | LabourCommand::PostLabourUpdate(..)
            | LabourCommand::UpdateLabourUpdateMessage(..)
            | LabourCommand::UpdateLabourUpdateType(..)
            | LabourCommand::DeleteLabourUpdate(..) => Capability::ExecuteLabourCommand,

            LabourCommand::AdvanceLabourPhase(..) => Capability::AdvanceLabourPhase,

            LabourCommand::PostApplicationLabourUpdate(..) => {
                Capability::PostApplicationLabourUpdates
            }

            LabourCommand::RequestAccess(..)
            | LabourCommand::Unsubscribe(..)
            | LabourCommand::UpdateNotificationMethods(..) => Capability::ManageOwnSubscription,

            LabourCommand::UpdateAccessLevel(..) => Capability::UpdateSubscriptionAccessLevel,

            LabourCommand::SetSubscriptionToken(..) => Capability::ManageSubscriptionToken,

            LabourCommand::ApproveSubscriber(..)
            | LabourCommand::RemoveSubscriber(..)
            | LabourCommand::BlockSubscriber(..)
            | LabourCommand::UnblockSubscriber(..)
            | LabourCommand::UpdateSubscriberRole(..) => Capability::ManageLabourSubscriptions,
        },

        Action::CheckoutCommand(cmd) => match cmd {
            CheckoutCommand::CreateCheckoutSession { .. } => Capability::ManageOwnSubscription,
        },

        Action::Query(q) => match q {
            QueryAction::GetLabour
            | QueryAction::GetContractions
            | QueryAction::GetLabourUpdates => Capability::ReadLabour,

            QueryAction::GetUserSubscription => Capability::ReadOwnSubscription,

            QueryAction::GetSubscriptionToken
            | QueryAction::GetLabourSubscriptions
            | QueryAction::GetUser
            | QueryAction::GetUsers => Capability::ReadSubscriptions,
        },
    }
}
