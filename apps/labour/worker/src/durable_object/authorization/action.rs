use fern_labour_labour_shared::commands::checkout::CheckoutCommand;

use crate::durable_object::write_side::domain::LabourCommand;

#[derive(Debug, Clone)]
pub enum Action {
    Command(LabourCommand),
    CheckoutCommand(CheckoutCommand),
    Query(QueryAction),
}

#[derive(Debug, Clone)]
pub enum QueryAction {
    GetLabour,
    GetContractions,
    GetLabourUpdates,
    GetSubscriptionToken,
    GetLabourSubscriptions,
    GetUserSubscription,
    GetUser,
    GetUsers,
}
