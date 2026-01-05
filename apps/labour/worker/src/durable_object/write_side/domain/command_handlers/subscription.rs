use fern_labour_labour_shared::value_objects::subscriber::status::SubscriberStatus;

use crate::durable_object::write_side::domain::{
    Labour, LabourError, LabourEvent,
    commands::subscription::{
        ApproveSubscriber, BlockSubscriber, InvalidateSubscriptionToken, RemoveSubscriber,
        SetSubscriptionToken, UnblockSubscriber, UpdateSubscriberRole,
    },
    events::{
        SubscriberApproved, SubscriberBlocked, SubscriberRemoved, SubscriberRoleUpdated,
        SubscriberUnblocked, SubscriptionTokenInvalidated, SubscriptionTokenSet,
    },
};

pub fn handle_set_subscription_token(
    state: Option<&Labour>,
    cmd: SetSubscriptionToken,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(_) = state else {
        return Err(LabourError::NotFound);
    };
    Ok(vec![LabourEvent::SubscriptionTokenSet(
        SubscriptionTokenSet {
            labour_id: cmd.labour_id,
            token: cmd.token,
        },
    )])
}

pub fn handle_invalidate_subscription_token(
    state: Option<&Labour>,
    cmd: InvalidateSubscriptionToken,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(_) = state else {
        return Err(LabourError::NotFound);
    };
    Ok(vec![LabourEvent::SubscriptionTokenInvalidated(
        SubscriptionTokenInvalidated {
            labour_id: cmd.labour_id,
        },
    )])
}

pub fn handle_approve_subscriber(
    state: Option<&Labour>,
    cmd: ApproveSubscriber,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let Some(subscription) = labour.find_subscription(cmd.subscription_id) else {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    if subscription.status() != &SubscriberStatus::REQUESTED {
        return Err(LabourError::InvalidCommand(
            "Subscription is not in REQUESTED state".to_string(),
        ));
    }

    Ok(vec![LabourEvent::SubscriberApproved(SubscriberApproved {
        labour_id: cmd.labour_id,
        subscription_id: cmd.subscription_id,
    })])
}

pub fn handle_remove_subscriber(
    state: Option<&Labour>,
    cmd: RemoveSubscriber,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let Some(subscription) = labour.find_subscription(cmd.subscription_id) else {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    if [SubscriberStatus::BLOCKED, SubscriberStatus::REMOVED].contains(subscription.status()) {
        return Err(LabourError::InvalidCommand(
            "Cannot remove subscriber".to_string(),
        ));
    }

    Ok(vec![LabourEvent::SubscriberRemoved(SubscriberRemoved {
        labour_id: cmd.labour_id,
        subscription_id: cmd.subscription_id,
    })])
}

pub fn handle_block_subscriber(
    state: Option<&Labour>,
    cmd: BlockSubscriber,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let Some(subscription) = labour.find_subscription(cmd.subscription_id) else {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    if subscription.status() == &SubscriberStatus::BLOCKED {
        return Err(LabourError::InvalidCommand(
            "Subscriber is already blocked".to_string(),
        ));
    }

    Ok(vec![LabourEvent::SubscriberBlocked(SubscriberBlocked {
        labour_id: cmd.labour_id,
        subscription_id: cmd.subscription_id,
    })])
}

pub fn handle_unblock_subscriber(
    state: Option<&Labour>,
    cmd: UnblockSubscriber,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let Some(subscription) = labour.find_subscription(cmd.subscription_id) else {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    if subscription.status() != &SubscriberStatus::BLOCKED {
        return Err(LabourError::InvalidCommand(
            "Subscriber is not blocked".to_string(),
        ));
    }

    Ok(vec![LabourEvent::SubscriberUnblocked(
        SubscriberUnblocked {
            labour_id: cmd.labour_id,
            subscription_id: cmd.subscription_id,
        },
    )])
}

pub fn handle_update_subscriber_role(
    state: Option<&Labour>,
    cmd: UpdateSubscriberRole,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let Some(subscription) = labour.find_subscription(cmd.subscription_id) else {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    if &cmd.role == subscription.role() {
        return Err(LabourError::InvalidCommand(
            "Subscriber already has role".to_string(),
        ));
    }

    Ok(vec![LabourEvent::SubscriberRoleUpdated(
        SubscriberRoleUpdated {
            labour_id: cmd.labour_id,
            subscription_id: cmd.subscription_id,
            role: cmd.role,
        },
    )])
}
