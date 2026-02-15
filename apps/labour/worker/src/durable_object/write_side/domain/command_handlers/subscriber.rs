use fern_labour_labour_shared::value_objects::{LabourPhase, subscriber::status::SubscriberStatus};
use uuid::Uuid;

use crate::durable_object::write_side::domain::{
    Labour, LabourError, LabourEvent,
    commands::subscriber::{
        RequestAccess, Unsubscribe, UpdateAccessLevel, UpdateNotificationMethods,
    },
    events::{
        SubscriberAccessLevelUpdated, SubscriberNotificationMethodsUpdated, SubscriberRequested,
        SubscriberUnsubscribed,
    },
};

pub fn handle_request_access(
    state: Option<&Labour>,
    cmd: RequestAccess,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    if cmd.subscriber_id == labour.mother_id() {
        return Err(LabourError::InvalidCommand(
            "Cannot subscribe to own labour".to_string(),
        ));
    }

    if labour.phase() == &LabourPhase::COMPLETE {
        return Err(LabourError::InvalidCommand(
            "Cannot subscribe to completed labour".to_string(),
        ));
    }

    let Some(subscription_token) = labour.subscription_token() else {
        return Err(LabourError::InvalidCommand(
            "Labour has no subscription token set".to_string(),
        ));
    };

    if &cmd.token != subscription_token {
        return Err(LabourError::InvalidCommand(
            "Incorrect subscription token".to_string(),
        ));
    }

    let mut events = vec![];

    if let Some(subscription) = labour.find_subscription_from_subscriber_id(&cmd.subscriber_id) {
        let error = "Cannot subscribe to labour";
        match subscription.status() {
            SubscriberStatus::SUBSCRIBED => {
                return Err(LabourError::InvalidCommand(format!(
                    "{error}: Already subscribed"
                )));
            }
            SubscriberStatus::REQUESTED => {
                return Err(LabourError::InvalidCommand(format!(
                    "{error}: Request pending"
                )));
            }
            SubscriberStatus::BLOCKED => {
                return Err(LabourError::InvalidCommand(error.to_string()));
            }
            _ => (),
        };
        events.push(LabourEvent::SubscriberRequested(SubscriberRequested {
            labour_id: cmd.labour_id,
            subscriber_name: cmd.subscriber_name,
            subscriber_id: cmd.subscriber_id,
            subscription_id: subscription.id(),
        }))
    } else {
        events.push(LabourEvent::SubscriberRequested(SubscriberRequested {
            labour_id: cmd.labour_id,
            subscriber_name: cmd.subscriber_name,
            subscriber_id: cmd.subscriber_id,
            subscription_id: Uuid::now_v7(),
        }))
    }
    Ok(events)
}

pub fn handle_unsubscribe(
    state: Option<&Labour>,
    cmd: Unsubscribe,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let Some(subscription) = labour.find_subscription(cmd.subscription_id) else {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    if subscription.status() != &SubscriberStatus::SUBSCRIBED {
        return Err(LabourError::InvalidCommand(
            "Cannot unsubscribe from labour".to_string(),
        ));
    }

    Ok(vec![LabourEvent::SubscriberUnsubscribed(
        SubscriberUnsubscribed {
            labour_id: cmd.labour_id,
            subscription_id: cmd.subscription_id,
        },
    )])
}

pub fn handle_update_notification_methods(
    state: Option<&Labour>,
    cmd: UpdateNotificationMethods,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    if labour.find_subscription(cmd.subscription_id).is_none() {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    Ok(vec![LabourEvent::SubscriberNotificationMethodsUpdated(
        SubscriberNotificationMethodsUpdated {
            labour_id: cmd.labour_id,
            subscription_id: cmd.subscription_id,
            notification_methods: cmd.notification_methods,
        },
    )])
}

pub fn handle_update_access_level(
    state: Option<&Labour>,
    cmd: UpdateAccessLevel,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let Some(subscription) = labour.find_subscription(cmd.subscription_id) else {
        return Err(LabourError::InvalidCommand(
            "Subscription not found".to_string(),
        ));
    };

    if subscription.access_level() == &cmd.access_level {
        return Err(LabourError::InvalidCommand(
            "Subscription already has access level".to_string(),
        ));
    }

    Ok(vec![LabourEvent::SubscriberAccessLevelUpdated(
        SubscriberAccessLevelUpdated {
            labour_id: cmd.labour_id,
            subscription_id: cmd.subscription_id,
            access_level: cmd.access_level,
        },
    )])
}
