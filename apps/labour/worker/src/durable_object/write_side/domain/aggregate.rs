use std::fmt::Debug;

use chrono::{DateTime, Duration, Utc};
use fern_labour_labour_shared::value_objects::{LabourPhase, LabourUpdateType};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use fern_labour_event_sourcing_rs::Aggregate;

use crate::durable_object::write_side::domain::{
    LabourCommand, LabourError, LabourEvent,
    command_handlers::{subscription::handle_invalidate_subscription_token, *},
    entities::{
        contraction::Contraction,
        labour_update::{ANNOUNCEMENT_COOLDOWN_SECONDS, LabourUpdate},
        subscription::Subscription,
    },
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Labour {
    id: Uuid,
    mother_id: String,
    phase: LabourPhase,
    subscription_token: Option<String>,
    contractions: Vec<Contraction>,
    labour_updates: Vec<LabourUpdate>,
    subscriptions: Vec<Subscription>,
    start_time: Option<DateTime<Utc>>,
    end_time: Option<DateTime<Utc>>,
}

impl Labour {
    pub fn mother_id(&self) -> &str {
        &self.mother_id
    }

    pub fn phase(&self) -> &LabourPhase {
        &self.phase
    }

    pub fn subscriptions(&self) -> &[Subscription] {
        &self.subscriptions
    }

    pub fn subscription_token(&self) -> Option<&String> {
        self.subscription_token.as_ref()
    }

    pub fn contractions(&self) -> &[Contraction] {
        &self.contractions
    }

    pub fn find_active_contraction(&self) -> Option<&Contraction> {
        self.contractions.iter().find(|c| c.is_active())
    }

    pub fn find_contraction(&self, contraction_id: Uuid) -> Option<&Contraction> {
        self.contractions.iter().find(|c| c.id() == contraction_id)
    }

    pub fn find_labour_update(&self, labour_update_id: Uuid) -> Option<&LabourUpdate> {
        self.labour_updates
            .iter()
            .find(|lu| lu.id() == labour_update_id)
    }

    pub fn find_last_announcement(&self) -> Option<&LabourUpdate> {
        self.labour_updates
            .iter()
            .filter(|lu| lu.labour_update_type() == &LabourUpdateType::ANNOUNCEMENT)
            .max_by_key(|lu| lu.sent_time())
    }

    pub fn can_send_announcement(&self) -> bool {
        match self.find_last_announcement() {
            None => true,
            Some(last) => {
                Utc::now() - last.sent_time() > Duration::seconds(ANNOUNCEMENT_COOLDOWN_SECONDS)
            }
        }
    }

    pub fn find_subscription_from_subscriber_id(
        &self,
        subscriber_id: &str,
    ) -> Option<&Subscription> {
        self.subscriptions
            .iter()
            .find(|s| s.subscriber_id() == subscriber_id)
    }

    pub fn find_subscription(&self, subscription_id: Uuid) -> Option<&Subscription> {
        self.subscriptions
            .iter()
            .find(|s| s.id() == subscription_id)
    }

    pub fn has_overlapping_contractions(
        &self,
        updated_contraction_id: Uuid,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
    ) -> bool {
        if self.contractions.len() <= 1 {
            return false;
        }

        let updated_contraction = match self.find_contraction(updated_contraction_id) {
            Some(c) => c,
            None => return false,
        };

        let new_start = start_time.unwrap_or(*updated_contraction.start_time());
        let new_end = end_time.unwrap_or(*updated_contraction.end_time());

        for contraction in &self.contractions {
            if contraction.id() == updated_contraction_id || contraction.is_active() {
                continue;
            }

            if new_start < *contraction.end_time() && *contraction.start_time() < new_end {
                return true;
            }
        }

        false
    }
}

impl Aggregate for Labour {
    type Command = LabourCommand;
    type Error = LabourError;
    type Event = LabourEvent;

    fn aggregate_id(&self) -> String {
        self.id.to_string()
    }

    fn apply(&mut self, event: &Self::Event) {
        match event {
            LabourEvent::LabourPlanned(e) => {
                self.id = e.labour_id;
                self.mother_id = e.mother_id.clone();
                self.phase = LabourPhase::PLANNED;
            }
            LabourEvent::LabourBegun(e) => {
                self.start_time = Some(e.start_time);
            }
            LabourEvent::LabourCompleted(e) => {
                self.end_time = Some(e.end_time);
            }
            LabourEvent::LabourPhaseChanged(e) => {
                self.phase = e.labour_phase.clone();
            }
            LabourEvent::ContractionStarted(e) => {
                if let Ok(contraction) =
                    Contraction::start(e.contraction_id, e.labour_id, e.start_time)
                {
                    self.contractions.push(contraction);
                }
            }
            LabourEvent::ContractionEnded(e) => {
                if let Some(contraction) = self.contractions.last_mut() {
                    contraction
                        .end(e.end_time, e.intensity)
                        .expect("Failed to end contraction");
                }
            }
            LabourEvent::ContractionUpdated(e) => {
                if let Some(contraction) = self
                    .contractions
                    .iter_mut()
                    .find(|c| c.id() == e.contraction_id)
                {
                    contraction
                        .update(e.start_time, e.end_time, e.intensity)
                        .expect("Failed to update contraction");
                }
            }
            LabourEvent::ContractionDeleted(e) => {
                self.contractions.pop_if(|c| c.id() == e.contraction_id);
            }
            LabourEvent::LabourUpdatePosted(e) => {
                let labour_update = LabourUpdate::create(
                    e.labour_id,
                    e.labour_update_id,
                    e.labour_update_type.clone(),
                    e.message.clone(),
                    e.sent_time,
                    e.application_generated,
                );
                self.labour_updates.push(labour_update);
            }
            LabourEvent::LabourUpdateMessageUpdated(e) => {
                if let Some(labour_update) = self
                    .labour_updates
                    .iter_mut()
                    .find(|lu| lu.id() == e.labour_update_id)
                {
                    labour_update.update_message(e.message.clone());
                }
            }
            LabourEvent::LabourUpdateTypeUpdated(e) => {
                if let Some(labour_update) = self
                    .labour_updates
                    .iter_mut()
                    .find(|lu| lu.id() == e.labour_update_id)
                {
                    labour_update.update_type(e.labour_update_type.clone());
                }
            }
            LabourEvent::LabourUpdateDeleted(e) => {
                self.labour_updates.pop_if(|c| c.id() == e.labour_update_id);
            }
            LabourEvent::SubscriberRequested(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.request();
                } else {
                    let subscription = Subscription::create(
                        e.subscription_id,
                        e.labour_id,
                        e.subscriber_id.clone(),
                    );
                    self.subscriptions.push(subscription);
                }
            }
            LabourEvent::SubscriberUnsubscribed(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.unsubscribe();
                }
            }
            LabourEvent::SubscriberNotificationMethodsUpdated(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.update_notification_methods(e.notification_methods.clone());
                }
            }
            LabourEvent::SubscriberAccessLevelUpdated(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.update_access_level(e.access_level.clone());
                }
            }
            LabourEvent::SubscriberApproved(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.approve();
                }
            }
            LabourEvent::SubscriberRemoved(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.remove();
                }
            }
            LabourEvent::SubscriberBlocked(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.block();
                }
            }
            LabourEvent::SubscriberUnblocked(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.unblock();
                }
            }
            LabourEvent::SubscriberRoleUpdated(e) => {
                if let Some(subscription) = self
                    .subscriptions
                    .iter_mut()
                    .find(|s| s.id() == e.subscription_id)
                {
                    subscription.update_role(e.role.clone());
                }
            }
            LabourEvent::SubscriptionTokenSet(e) => {
                self.subscription_token = Some(e.token.clone());
            }
            LabourEvent::SubscriptionTokenInvalidated(_) => {
                self.subscription_token = None;
            }
            LabourEvent::LabourPlanUpdated(_)
            | LabourEvent::LabourInviteSent(_)
            | LabourEvent::LabourDeleted(_) => {}
        }
    }

    fn handle_command(
        state: Option<&Self>,
        command: Self::Command,
    ) -> std::result::Result<Vec<Self::Event>, Self::Error> {
        match command {
            // Labour commands
            LabourCommand::PlanLabour(cmd) => handle_plan_labour(state, cmd),
            LabourCommand::UpdateLabourPlan(cmd) => handle_update_labour_plan(state, cmd),
            LabourCommand::BeginLabour(cmd) => handle_begin_labour(state, cmd),
            LabourCommand::CompleteLabour(cmd) => handle_complete_labour(state, cmd),
            LabourCommand::SendLabourInvite(cmd) => handle_send_labour_invite(state, cmd),
            LabourCommand::DeleteLabour(cmd) => handle_delete_labour(state, cmd),
            LabourCommand::AdvanceLabourPhase(cmd) => handle_advance_labour_phase(state, cmd),

            // Contraction commands
            LabourCommand::StartContraction(cmd) => handle_start_contraction(state, cmd),
            LabourCommand::EndContraction(cmd) => handle_end_contraction(state, cmd),
            LabourCommand::UpdateContraction(cmd) => handle_update_contraction(state, cmd),
            LabourCommand::DeleteContraction(cmd) => handle_delete_contraction(state, cmd),

            // Labour update commands
            LabourCommand::PostLabourUpdate(cmd) => handle_post_labour_update(state, cmd),
            LabourCommand::PostApplicationLabourUpdate(cmd) => {
                handle_post_application_labour_update(state, cmd)
            }
            LabourCommand::UpdateLabourUpdateType(cmd) => {
                handle_update_labour_update_type(state, cmd)
            }
            LabourCommand::UpdateLabourUpdateMessage(cmd) => {
                handle_update_labour_update_message(state, cmd)
            }
            LabourCommand::DeleteLabourUpdate(cmd) => handle_delete_labour_update(state, cmd),

            // Subscriber commands
            LabourCommand::RequestAccess(cmd) => handle_request_access(state, cmd),
            LabourCommand::Unsubscribe(cmd) => handle_unsubscribe(state, cmd),
            LabourCommand::UpdateNotificationMethods(cmd) => {
                handle_update_notification_methods(state, cmd)
            }
            LabourCommand::UpdateAccessLevel(cmd) => handle_update_access_level(state, cmd),

            // Subscription commands
            LabourCommand::SetSubscriptionToken(cmd) => handle_set_subscription_token(state, cmd),
            LabourCommand::InvalidateSubscriptionToken(cmd) => {
                handle_invalidate_subscription_token(state, cmd)
            }
            LabourCommand::ApproveSubscriber(cmd) => handle_approve_subscriber(state, cmd),
            LabourCommand::RemoveSubscriber(cmd) => handle_remove_subscriber(state, cmd),
            LabourCommand::BlockSubscriber(cmd) => handle_block_subscriber(state, cmd),
            LabourCommand::UnblockSubscriber(cmd) => handle_unblock_subscriber(state, cmd),
            LabourCommand::UpdateSubscriberRole(cmd) => handle_update_subscriber_role(state, cmd),
        }
    }

    fn from_events(events: &[Self::Event]) -> Option<Self> {
        let mut notification = match events.first() {
            Some(LabourEvent::LabourPlanned(e)) => Labour {
                id: e.labour_id,
                mother_id: e.mother_id.clone(),
                phase: LabourPhase::PLANNED,
                subscription_token: None,
                contractions: vec![],
                labour_updates: vec![],
                subscriptions: vec![],
                start_time: None,
                end_time: None,
            },
            _ => return None,
        };

        for event in events.iter().skip(1) {
            notification.apply(event);
        }

        Some(notification)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::durable_object::write_side::domain::{
        commands::{
            contraction::{EndContraction, StartContraction},
            labour::{BeginLabour, CompleteLabour, PlanLabour},
        },
        events::*,
    };
    use chrono::TimeZone;

    struct AggregateTestHarness {
        events: Vec<LabourEvent>,
    }

    impl AggregateTestHarness {
        fn given(events: Vec<LabourEvent>) -> Self {
            Self { events }
        }

        fn given_no_events() -> Self {
            Self { events: vec![] }
        }

        fn state(&self) -> Option<Labour> {
            if self.events.is_empty() {
                None
            } else {
                Labour::from_events(&self.events)
            }
        }

        fn when(&self, command: LabourCommand) -> Result<Vec<LabourEvent>, LabourError> {
            Labour::handle_command(self.state().as_ref(), command)
        }
    }

    fn labour_id() -> Uuid {
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    }

    fn plan_labour_cmd() -> LabourCommand {
        LabourCommand::PlanLabour(PlanLabour {
            labour_id: labour_id(),
            mother_id: "mother_123".to_string(),
            mother_name: "Test Mother".to_string(),
            first_labour: true,
            due_date: Utc::now(),
            labour_name: Some("Baby Smith".to_string()),
        })
    }

    fn planned_labour_events() -> Vec<LabourEvent> {
        vec![
            LabourEvent::LabourPlanned(LabourPlanned {
                labour_id: labour_id(),
                mother_id: "mother_123".to_string(),
                mother_name: "Test Mother".to_string(),
                first_labour: true,
                due_date: Utc::now(),
                labour_name: Some("Baby Smith".to_string()),
            }),
            LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: labour_id(),
                labour_phase: LabourPhase::PLANNED,
            }),
        ]
    }

    fn begun_labour_events() -> Vec<LabourEvent> {
        let mut events = planned_labour_events();
        events.extend(vec![
            LabourEvent::LabourBegun(LabourBegun {
                labour_id: labour_id(),
                start_time: Utc::now(),
            }),
            LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: labour_id(),
                labour_phase: LabourPhase::EARLY,
            }),
            LabourEvent::LabourUpdatePosted(LabourUpdatePosted {
                labour_id: labour_id(),
                labour_update_id: Uuid::now_v7(),
                labour_update_type: LabourUpdateType::PRIVATE_NOTE,
                message: "labour_begun".to_string(),
                application_generated: true,
                sent_time: Utc::now(),
            }),
        ]);
        events
    }

    fn contraction_events(count: usize, duration_mins: f64, intensity: u8) -> Vec<LabourEvent> {
        let base_time = Utc.with_ymd_and_hms(2024, 1, 1, 12, 0, 0).unwrap();
        let mut events = vec![];

        for i in 0..count {
            let contraction_id = Uuid::now_v7();
            let start = base_time + chrono::Duration::minutes(i as i64 * 10);
            let end = start + chrono::Duration::seconds((duration_mins * 60.0) as i64);

            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id,
                start_time: start,
            }));
            events.push(LabourEvent::ContractionEnded(ContractionEnded {
                labour_id: labour_id(),
                contraction_id,
                end_time: end,
                intensity,
            }));
        }
        events
    }

    mod plan_labour {
        use super::*;

        #[test]
        fn given_no_aggregate_when_plan_labour_then_labour_planned_and_phase_set() {
            // Given
            let harness = AggregateTestHarness::given_no_events();

            // When
            let result = harness.when(plan_labour_cmd());

            // Then
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 2);
            assert!(matches!(events[0], LabourEvent::LabourPlanned(_)));
            assert!(matches!(
                &events[1],
                LabourEvent::LabourPhaseChanged(e) if e.labour_phase == LabourPhase::PLANNED
            ));
        }

        #[test]
        fn given_existing_labour_when_plan_labour_then_error() {
            // Given
            let harness = AggregateTestHarness::given(planned_labour_events());

            // When
            let result = harness.when(plan_labour_cmd());

            // Then
            assert!(matches!(
                result,
                Err(LabourError::InvalidStateTransition(_, _))
            ));
        }
    }

    mod begin_labour {
        use super::*;

        #[test]
        fn given_planned_labour_when_begin_then_begun_phase_changed_and_update_posted() {
            // Given
            let harness = AggregateTestHarness::given(planned_labour_events());

            // When
            let result = harness.when(LabourCommand::BeginLabour(BeginLabour {
                labour_id: labour_id(),
            }));

            // Then
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 3);
            assert!(matches!(events[0], LabourEvent::LabourBegun(_)));
            assert!(matches!(
                &events[1],
                LabourEvent::LabourPhaseChanged(e) if e.labour_phase == LabourPhase::EARLY
            ));
            assert!(matches!(
                &events[2],
                LabourEvent::LabourUpdatePosted(e) if e.message == "labour_begun" && e.application_generated
            ));
        }

        #[test]
        fn given_already_begun_labour_when_begin_then_error() {
            // Given
            let harness = AggregateTestHarness::given(begun_labour_events());

            // When
            let result = harness.when(LabourCommand::BeginLabour(BeginLabour {
                labour_id: labour_id(),
            }));

            // Then
            assert!(matches!(
                result,
                Err(LabourError::InvalidStateTransition(_, _))
            ));
        }
    }

    mod complete_labour {
        use super::*;

        #[test]
        fn given_begun_labour_when_complete_then_completed_and_phase_changed() {
            // Given
            let harness = AggregateTestHarness::given(begun_labour_events());

            // When
            let result = harness.when(LabourCommand::CompleteLabour(CompleteLabour {
                labour_id: labour_id(),
                notes: Some("Healthy baby!".to_string()),
            }));

            // Then
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 2);
            assert!(matches!(
                &events[0],
                LabourEvent::LabourCompleted(e) if e.notes == Some("Healthy baby!".to_string())
            ));
            assert!(matches!(
                &events[1],
                LabourEvent::LabourPhaseChanged(e) if e.labour_phase == LabourPhase::COMPLETE
            ));
        }

        #[test]
        fn given_active_contraction_when_complete_then_error() {
            // Given - labour with an active (not ended) contraction
            let mut events = begun_labour_events();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: Uuid::now_v7(),
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When
            let result = harness.when(LabourCommand::CompleteLabour(CompleteLabour {
                labour_id: labour_id(),
                notes: None,
            }));

            // Then
            assert!(matches!(result, Err(LabourError::ValidationError(_))));
        }
    }

    mod contractions {
        use super::*;

        #[test]
        fn given_begun_labour_when_start_contraction_then_contraction_started() {
            // Given
            let harness = AggregateTestHarness::given(begun_labour_events());

            // When
            let result = harness.when(LabourCommand::StartContraction(StartContraction {
                labour_id: labour_id(),
                contraction_id: Uuid::now_v7(),
                start_time: Utc::now(),
            }));

            // Then
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 1);
            assert!(matches!(events[0], LabourEvent::ContractionStarted(_)));
        }

        #[test]
        fn given_planned_labour_when_start_contraction_then_labour_begun_automatically() {
            // Given - labour in PLANNED phase
            let harness = AggregateTestHarness::given(planned_labour_events());

            // When
            let result = harness.when(LabourCommand::StartContraction(StartContraction {
                labour_id: labour_id(),
                contraction_id: Uuid::now_v7(),
                start_time: Utc::now(),
            }));

            // Then - should emit LabourBegun before ContractionStarted
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 3);
            assert!(matches!(events[0], LabourEvent::LabourBegun(_)));
            assert!(matches!(events[1], LabourEvent::LabourPhaseChanged(_)));
            assert!(matches!(events[2], LabourEvent::ContractionStarted(_)));
        }

        #[test]
        fn given_completed_contraction_when_start_another_with_same_id_then_error() {
            // Given
            let mut events = begun_labour_events();
            let contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: contraction_id,
                start_time: Utc::now(),
            }));
            events.push(LabourEvent::ContractionEnded(ContractionEnded {
                labour_id: labour_id(),
                contraction_id,
                end_time: Utc::now(),
                intensity: 5,
            }));
            let harness = AggregateTestHarness::given(events);

            // When
            let result = harness.when(LabourCommand::StartContraction(StartContraction {
                labour_id: labour_id(),
                contraction_id,
                start_time: Utc::now(),
            }));
            // Then
            assert!(matches!(result, Err(LabourError::InvalidCommand(_))));
        }

        #[test]
        fn given_contraction_in_progress_when_end_twice_then_error() {
            // Given
            let mut events = begun_labour_events();
            let contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: contraction_id,
                start_time: Utc::now(),
            }));
            events.push(LabourEvent::ContractionEnded(ContractionEnded {
                labour_id: labour_id(),
                contraction_id,
                end_time: Utc::now(),
                intensity: 5,
            }));
            let harness = AggregateTestHarness::given(events);

            // When
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id,
                end_time: Utc::now(),
                intensity: 5,
            }));
            // Then
            assert!(matches!(result, Err(LabourError::InvalidCommand(_))));
        }
    }

    mod phase_progression {
        use super::*;

        #[test]
        fn given_early_labour_with_low_intensity_when_end_contraction_then_no_phase_change() {
            // Given - labour with 4 completed contractions below ACTIVE threshold
            let mut events = begun_labour_events();
            events.extend(contraction_events(4, 0.5, 5)); // intensity 5, duration 0.5 min
            // Add an active contraction
            let active_contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When - end the contraction with low intensity
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                end_time: Utc::now(),
                intensity: 5,
            }));

            // Then - only ContractionEnded, no phase change
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 1);
            assert!(matches!(events[0], LabourEvent::ContractionEnded(_)));
        }

        #[test]
        fn given_early_labour_when_contractions_meet_active_threshold_then_phase_advances() {
            // Given - labour with 4 completed contractions meeting ACTIVE threshold
            let mut events = begun_labour_events();
            events.extend(contraction_events(4, 1.0, 7)); // intensity 7, duration 1.0 min
            // Add an active contraction
            let active_contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When - end the contraction meeting ACTIVE threshold
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                end_time: Utc::now() + chrono::Duration::minutes(1),
                intensity: 7,
            }));

            // Then - ContractionEnded AND LabourPhaseChanged to ACTIVE
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 2);
            assert!(matches!(events[0], LabourEvent::ContractionEnded(_)));
            assert!(matches!(
                &events[1],
                LabourEvent::LabourPhaseChanged(e) if e.labour_phase == LabourPhase::ACTIVE
            ));
        }

        #[test]
        fn given_early_labour_when_contractions_meet_transition_threshold_then_phase_advances_to_transition()
         {
            // Given - labour with 4 completed contractions meeting TRANSITION threshold
            let mut events = begun_labour_events();
            events.extend(contraction_events(4, 1.5, 8)); // intensity 8, duration 1.5 min
            // Add an active contraction
            let active_contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When - end the contraction meeting TRANSITION threshold
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                end_time: Utc::now() + chrono::Duration::seconds(90),
                intensity: 8,
            }));

            // Then - advances directly to TRANSITION (skips ACTIVE)
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 2);
            assert!(matches!(
                &events[1],
                LabourEvent::LabourPhaseChanged(e) if e.labour_phase == LabourPhase::TRANSITION
            ));
        }

        #[test]
        fn given_active_labour_when_high_contractions_then_advances_to_transition() {
            // Given - labour already in ACTIVE phase
            let mut events = begun_labour_events();
            events.push(LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: labour_id(),
                labour_phase: LabourPhase::ACTIVE,
            }));
            events.extend(contraction_events(4, 1.5, 8));
            let active_contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                end_time: Utc::now() + chrono::Duration::seconds(90),
                intensity: 9,
            }));

            // Then - advances to TRANSITION
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 2);
            assert!(matches!(
                &events[1],
                LabourEvent::LabourPhaseChanged(e) if e.labour_phase == LabourPhase::TRANSITION
            ));
        }

        #[test]
        fn given_transition_phase_when_contractions_still_high_then_no_phase_change() {
            // Given - labour already in TRANSITION phase (highest non-complete phase)
            let mut events = begun_labour_events();
            events.push(LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: labour_id(),
                labour_phase: LabourPhase::TRANSITION,
            }));
            events.extend(contraction_events(4, 2.0, 9));

            let active_contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                end_time: Utc::now() + chrono::Duration::minutes(2),
                intensity: 9,
            }));

            // Then - only ContractionEnded, no phase change (already at TRANSITION)
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 1);
            assert!(matches!(events[0], LabourEvent::ContractionEnded(_)));
        }

        #[test]
        fn given_transition_phase_when_contractions_drop_to_active_level_then_no_downgrade() {
            // Given - labour in TRANSITION phase, but recent contractions only meet ACTIVE threshold
            let mut events = begun_labour_events();
            events.push(LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: labour_id(),
                labour_phase: LabourPhase::TRANSITION,
            }));
            // Add contractions that only meet ACTIVE threshold (intensity 6-7, duration 1.0 min)
            events.extend(contraction_events(4, 1.0, 6));

            let active_contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When - end contraction at ACTIVE level (below TRANSITION threshold)
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                end_time: Utc::now() + chrono::Duration::minutes(1),
                intensity: 6,
            }));

            // Then - phase stays at TRANSITION, no downgrade to ACTIVE
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 1);
            assert!(matches!(events[0], LabourEvent::ContractionEnded(_)));
            // Verify no LabourPhaseChanged event (monotonic - never goes backwards)
        }

        #[test]
        fn given_active_phase_when_contractions_drop_below_threshold_then_no_downgrade() {
            // Given - labour in ACTIVE phase, but recent contractions drop below all thresholds
            let mut events = begun_labour_events();
            events.push(LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: labour_id(),
                labour_phase: LabourPhase::ACTIVE,
            }));
            // Add contractions below ACTIVE threshold (intensity 4, duration 0.5 min)
            events.extend(contraction_events(4, 0.5, 4));

            let active_contraction_id = Uuid::now_v7();
            events.push(LabourEvent::ContractionStarted(ContractionStarted {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                start_time: Utc::now(),
            }));
            let harness = AggregateTestHarness::given(events);

            // When - end contraction below all thresholds
            let result = harness.when(LabourCommand::EndContraction(EndContraction {
                labour_id: labour_id(),
                contraction_id: active_contraction_id,
                end_time: Utc::now() + chrono::Duration::seconds(30),
                intensity: 4,
            }));

            // Then - phase stays at ACTIVE, no downgrade to EARLY
            let events = result.expect("should succeed");
            assert_eq!(events.len(), 1);
            assert!(matches!(events[0], LabourEvent::ContractionEnded(_)));
        }
    }
}
