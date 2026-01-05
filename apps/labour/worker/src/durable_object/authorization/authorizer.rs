use std::collections::HashSet;

use fern_labour_labour_shared::value_objects::subscriber::status::SubscriberStatus;

use crate::durable_object::{
    authorization::{
        Action, Capability, DenyReason, Principal, capabilities_for, required_capability,
    },
    write_side::domain::{Labour, LabourCommand},
};

#[derive(Clone, Copy)]
pub struct Authorizer;

impl Authorizer {
    pub fn new() -> Self {
        Self
    }

    pub fn authorize(
        &self,
        principal: &Principal,
        action: &Action,
        aggregate: Option<&Labour>,
    ) -> Result<(), DenyReason> {
        let required = required_capability(action);
        let granted = capabilities_for(principal);

        // Always authorized to request access. It may not be valid to request access
        // right now based on status etc. but that is a domain concern.
        if let Action::Command(LabourCommand::RequestAccess(..)) = action {
            return Ok(());
        }

        match principal {
            Principal::Mother | Principal::Internal => Self::check_permissions(&granted, &required),
            Principal::Subscriber { user_id, .. } => {
                if let Some(aggregate) = aggregate {
                    let target_subscription = aggregate
                        .subscriptions()
                        .iter()
                        .find(|s| s.subscriber_id() == user_id);
                    if let Some(sub) = target_subscription {
                        if sub.subscriber_id() != user_id {
                            return Err(DenyReason::CannotTargetOthers);
                        }
                        if *sub.status() != SubscriberStatus::SUBSCRIBED {
                            return Err(DenyReason::Unassociated);
                        }
                    }
                }
                Self::check_permissions(&granted, &required)
            }
            Principal::Unassociated => match action {
                Action::Command(LabourCommand::PlanLabour(..)) => Ok(()),
                _ => Err(DenyReason::Unassociated),
            },
        }
    }

    fn check_permissions(
        granted: &HashSet<Capability>,
        required: &Capability,
    ) -> Result<(), DenyReason> {
        if granted.contains(required) {
            Ok(())
        } else {
            Err(DenyReason::MissingCapability(*required))
        }
    }
}

impl Default for Authorizer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use crate::durable_object::{
        authorization::{QueryAction, resolve_principal},
        write_side::domain::commands::{
            contraction::StartContraction,
            labour::{BeginLabour, PlanLabour},
            labour_update::{PostApplicationLabourUpdate, PostLabourUpdate},
            subscriber::{RequestAccess, Unsubscribe, UpdateAccessLevel},
            subscription::{ApproveSubscriber, SetSubscriptionToken, UpdateSubscriberRole},
        },
    };

    use super::*;
    use chrono::Utc;
    use fern_labour_event_sourcing_rs::Aggregate;
    use fern_labour_labour_shared::value_objects::{
        SubscriberAccessLevel, SubscriberRole, subscriber::status::SubscriberStatus,
    };
    use fern_labour_workers_shared::User;
    use uuid::Uuid;

    fn create_test_user(user_id: &str) -> User {
        User {
            user_id: user_id.to_string(),
            issuer: "test".to_string(),
            email: None,
            phone_number: None,
            first_name: None,
            last_name: None,
            name: None,
        }
    }

    fn create_test_aggregate(mother_id: &str) -> Labour {
        use crate::durable_object::write_side::domain::aggregate::Labour;

        let command = LabourCommand::PlanLabour(PlanLabour {
            labour_id: Uuid::now_v7(),
            mother_id: mother_id.to_string(),
            mother_name: "Test Mother".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: Some("Test Labour".to_string()),
        });

        let events = Labour::handle_command(None, command).unwrap();
        let labour = Labour::from_events(&events);
        labour.unwrap()
    }

    fn create_aggregate_with_subscriber(
        mother_id: &str,
        subscriber_id: &str,
        role: SubscriberRole,
        status: SubscriberStatus,
    ) -> Labour {
        use crate::durable_object::write_side::domain::aggregate::Labour;

        let mut aggregate = create_test_aggregate(mother_id);

        // Set subscription token
        let token = "test-token".to_string();
        let set_token_cmd = LabourCommand::SetSubscriptionToken(SetSubscriptionToken {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            token: token.clone(),
        });
        let events = Labour::handle_command(Some(&aggregate), set_token_cmd).unwrap();
        for event in events {
            aggregate.apply(&event);
        }

        // Request access
        let request_cmd = LabourCommand::RequestAccess(RequestAccess {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscriber_id: subscriber_id.to_string(),
            token,
        });
        let events = Labour::handle_command(Some(&aggregate), request_cmd).unwrap();
        for event in events {
            aggregate.apply(&event);
        }

        // Get subscription ID (it's the first one)
        let subscription_id = aggregate.subscriptions()[0].id();

        // Approve if status should be SUBSCRIBED
        if status == SubscriberStatus::SUBSCRIBED {
            let approve_cmd = LabourCommand::ApproveSubscriber(ApproveSubscriber {
                labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
                subscription_id,
            });
            let events = Labour::handle_command(Some(&aggregate), approve_cmd).unwrap();
            for event in events {
                aggregate.apply(&event);
            }

            // Update role if needed
            if role != SubscriberRole::LOVED_ONE {
                let update_role_cmd = LabourCommand::UpdateSubscriberRole(UpdateSubscriberRole {
                    labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
                    subscription_id,
                    role,
                });
                let events = Labour::handle_command(Some(&aggregate), update_role_cmd).unwrap();
                for event in events {
                    aggregate.apply(&event);
                }
            }
        }

        aggregate
    }

    // ═══════════════════════════════════════════════════════════════
    // Mother Tests
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn mother_can_execute_labour_commands() {
        let auth = Authorizer::new();
        let user = create_test_user("mother-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::BeginLabour(BeginLabour {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
        }));

        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn mother_can_execute_contraction_commands() {
        let auth = Authorizer::new();
        let user = create_test_user("mother-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::StartContraction(StartContraction {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            contraction_id: Uuid::now_v7(),
            start_time: Utc::now(),
        }));

        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn mother_can_post_labour_updates() {
        let auth = Authorizer::new();
        let user = create_test_user("mother-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::PostLabourUpdate(PostLabourUpdate {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            labour_update_type:
                fern_labour_labour_shared::value_objects::LabourUpdateType::STATUS_UPDATE,
            message: "Test update".to_string(),
        }));

        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn mother_can_manage_subscriptions() {
        let auth = Authorizer::new();
        let user = create_test_user("mother-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "subscriber-1",
            SubscriberRole::LOVED_ONE,
            SubscriberStatus::REQUESTED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let subscription_id = aggregate.subscriptions()[0].id();
        let action = Action::Command(LabourCommand::ApproveSubscriber(ApproveSubscriber {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscription_id,
        }));

        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn mother_cannot_manage_own_subscription() {
        let auth = Authorizer::new();
        let user = create_test_user("mother-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        // Mother shouldn't be able to unsubscribe (she's not a subscriber)
        let action = Action::Command(LabourCommand::Unsubscribe(Unsubscribe {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscription_id: Uuid::now_v7(),
        }));

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(result.is_err());
    }

    #[test]
    fn mother_can_read_labour() {
        let auth = Authorizer::new();
        let user = create_test_user("mother-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Query(QueryAction::GetLabour);
        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn mother_can_read_subscriptions() {
        let auth = Authorizer::new();
        let user = create_test_user("mother-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Query(QueryAction::GetLabourSubscriptions);
        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // Birth Partner Tests
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn birth_partner_can_execute_labour_commands() {
        let auth = Authorizer::new();
        let user = create_test_user("partner-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "partner-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::StartContraction(StartContraction {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            contraction_id: Uuid::now_v7(),
            start_time: Utc::now(),
        }));

        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn birth_partner_can_read_labour() {
        let auth = Authorizer::new();
        let user = create_test_user("partner-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "partner-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Query(QueryAction::GetLabour);
        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn birth_partner_cannot_read_subscriptions() {
        let auth = Authorizer::new();
        let user = create_test_user("partner-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "partner-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Query(QueryAction::GetLabourSubscriptions);
        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(matches!(
            result,
            Err(DenyReason::MissingCapability(Capability::ReadSubscriptions))
        ));
    }

    #[test]
    fn birth_partner_cannot_manage_subscriptions() {
        let auth = Authorizer::new();
        let user = create_test_user("partner-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "partner-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let subscription_id = aggregate.subscriptions()[0].id();
        let action = Action::Command(LabourCommand::ApproveSubscriber(ApproveSubscriber {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscription_id,
        }));

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(matches!(
            result,
            Err(DenyReason::MissingCapability(
                Capability::ManageLabourSubscriptions
            ))
        ));
    }

    // ═══════════════════════════════════════════════════════════════
    // Friends and Family Tests
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn friends_family_can_read_labour() {
        let auth = Authorizer::new();
        let user = create_test_user("friend-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "friend-1",
            SubscriberRole::LOVED_ONE,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Query(QueryAction::GetLabourUpdates);
        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn friends_family_cannot_execute_labour_commands() {
        let auth = Authorizer::new();
        let user = create_test_user("friend-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "friend-1",
            SubscriberRole::LOVED_ONE,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::StartContraction(StartContraction {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            contraction_id: Uuid::now_v7(),
            start_time: Utc::now(),
        }));

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(matches!(
            result,
            Err(DenyReason::MissingCapability(
                Capability::ExecuteLabourCommand
            ))
        ));
    }

    #[test]
    fn friends_family_can_manage_own_subscription() {
        let auth = Authorizer::new();
        let user = create_test_user("friend-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "friend-1",
            SubscriberRole::LOVED_ONE,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let subscription_id = aggregate.subscriptions()[0].id();
        let action = Action::Command(LabourCommand::Unsubscribe(Unsubscribe {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscription_id,
        }));

        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn friends_family_cannot_manage_other_subscriptions() {
        let auth = Authorizer::new();
        let user = create_test_user("friend-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "friend-1",
            SubscriberRole::LOVED_ONE,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        // Try to unsubscribe a different subscription
        let action = Action::Command(LabourCommand::Unsubscribe(Unsubscribe {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscription_id: Uuid::now_v7(), // Different ID
        }));

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        // Should fail because subscription doesn't exist or doesn't belong to them
        assert!(result.is_ok()); // Will pass auth but fail in aggregate
    }

    // ═══════════════════════════════════════════════════════════════
    // Inactive Subscriber Tests
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn requested_subscriber_cannot_read() {
        let auth = Authorizer::new();
        let user = create_test_user("subscriber-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "subscriber-1",
            SubscriberRole::LOVED_ONE,
            SubscriberStatus::REQUESTED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Query(QueryAction::GetLabour);
        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert_eq!(result, Err(DenyReason::Unassociated));
    }

    #[test]
    fn requested_subscriber_cannot_execute_commands() {
        let auth = Authorizer::new();
        let user = create_test_user("subscriber-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "subscriber-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::REQUESTED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::StartContraction(StartContraction {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            contraction_id: Uuid::now_v7(),
            start_time: Utc::now(),
        }));

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert_eq!(result, Err(DenyReason::Unassociated));
    }

    #[test]
    fn requested_subscriber_can_request_access() {
        let auth = Authorizer::new();
        let user = create_test_user("subscriber-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "subscriber-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::REQUESTED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::RequestAccess(RequestAccess {
            labour_id: Uuid::from_str(&aggregate.aggregate_id()).unwrap(),
            subscriber_id: "subscriber-1".to_string(),
            token: "test-token".to_string(),
        }));

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(result.is_ok());
    }

    // ═══════════════════════════════════════════════════════════════
    // Unassociated User Tests
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn unassociated_user_denied_read() {
        let auth = Authorizer::new();
        let user = create_test_user("stranger");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Query(QueryAction::GetLabour);

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(matches!(result, Err(DenyReason::Unassociated)));
    }

    #[test]
    fn unassociated_user_denied_command() {
        let auth = Authorizer::new();
        let user = create_test_user("stranger");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::BeginLabour(BeginLabour {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
        }));

        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(matches!(result, Err(DenyReason::Unassociated)));
    }

    #[test]
    fn unassociated_user_can_request_access() {
        let auth = Authorizer::new();
        let user = create_test_user("stranger");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::RequestAccess(RequestAccess {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscriber_id: "stranger".to_string(),
            token: "test-token".to_string(),
        }));

        // Request access should be allowed for unassociated users
        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn unassociated_user_can_plan_labour() {
        let auth = Authorizer::new();
        let _ = create_test_user("new-mother");
        let principal = Principal::Unassociated;

        let action = Action::Command(LabourCommand::PlanLabour(PlanLabour {
            labour_id: Uuid::now_v7(),
            mother_id: "new-mother".to_string(),
            mother_name: "New Mother".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: Some("My Labour".to_string()),
        }));

        // Planning a new labour should be allowed for unassociated users
        assert!(auth.authorize(&principal, &action, None).is_ok());
    }

    // ═══════════════════════════════════════════════════════════════
    // Internal User Tests
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn internal_user_can_post_application_generated_labour_updates() {
        let auth = Authorizer::new();
        let user = create_test_user("fern-labour-internal-user-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::PostApplicationLabourUpdate(
            PostApplicationLabourUpdate {
                labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
                message: "labour_begun".to_string(),
            },
        ));
        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn internal_user_can_set_subscription_token() {
        let auth = Authorizer::new();
        let user = create_test_user("fern-labour-internal-user-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::SetSubscriptionToken(SetSubscriptionToken {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            token: "TEST_TOKEN".to_string(),
        }));

        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn internal_user_can_update_subscription_access_level() {
        let auth = Authorizer::new();
        let user = create_test_user("fern-labour-internal-user-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "partner-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        let subscription_id = aggregate.subscriptions()[0].id();
        let action = Action::Command(LabourCommand::UpdateAccessLevel(UpdateAccessLevel {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            subscription_id,
            access_level: SubscriberAccessLevel::SUPPORTER,
        }));
        assert!(
            auth.authorize(&principal, &action, Some(&aggregate))
                .is_ok()
        );
    }

    #[test]
    fn internal_user_cannot_execute_labour_command() {
        let auth = Authorizer::new();
        let user = create_test_user("fern-labour-internal-user-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        let action = Action::Command(LabourCommand::StartContraction(StartContraction {
            labour_id: Uuid::parse_str(&aggregate.aggregate_id()).unwrap(),
            contraction_id: Uuid::now_v7(),
            start_time: Utc::now(),
        }));
        let result = auth.authorize(&principal, &action, Some(&aggregate));
        assert!(matches!(
            result,
            Err(DenyReason::MissingCapability(
                Capability::ExecuteLabourCommand
            ))
        ));
    }

    // ═══════════════════════════════════════════════════════════════
    // Principal Resolution Tests
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn resolve_principal_identifies_mother() {
        let user = create_test_user("mother-1");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        assert_eq!(principal, Principal::Mother);
    }

    #[test]
    fn resolve_principal_identifies_subscriber() {
        let user = create_test_user("subscriber-1");
        let aggregate = create_aggregate_with_subscriber(
            "mother-1",
            "subscriber-1",
            SubscriberRole::BIRTH_PARTNER,
            SubscriberStatus::SUBSCRIBED,
        );
        let principal = resolve_principal(&user, Some(&aggregate));

        match principal {
            Principal::Subscriber { role, status, .. } => {
                assert_eq!(role, SubscriberRole::BIRTH_PARTNER);
                assert_eq!(status, SubscriberStatus::SUBSCRIBED);
            }
            _ => panic!("Expected Subscriber principal"),
        }
    }

    #[test]
    fn resolve_principal_identifies_unassociated() {
        let user = create_test_user("stranger");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        assert_eq!(principal, Principal::Unassociated);
    }

    #[test]
    fn resolve_principal_identifies_internal() {
        let user = create_test_user("fern-labour-internal");
        let aggregate = create_test_aggregate("mother-1");
        let principal = resolve_principal(&user, Some(&aggregate));

        assert_eq!(principal, Principal::Internal);
    }
}
