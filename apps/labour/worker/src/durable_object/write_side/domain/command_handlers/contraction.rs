use fern_labour_event_sourcing_rs::Aggregate;
use fern_labour_labour_shared::value_objects::LabourPhase;

use crate::durable_object::write_side::domain::{
    Labour, LabourError, LabourEvent,
    commands::contraction::{
        DeleteContraction, EndContraction, StartContraction, UpdateContraction,
    },
    events::{
        ContractionDeleted, ContractionEnded, ContractionStarted, ContractionUpdated, LabourBegun,
        LabourPhaseChanged,
    },
    services::LabourPhaseProgression,
};

pub fn handle_start_contraction(
    state: Option<&Labour>,
    cmd: StartContraction,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    let current_phase = labour.phase();

    if current_phase == &LabourPhase::COMPLETE {
        return Err(LabourError::InvalidCommand(
            "Cannot start contraction in completed labour".to_string(),
        ));
    }

    if labour.find_active_contraction().is_some() {
        return Err(LabourError::InvalidCommand(
            "Labour already has a contraction in progress".to_string(),
        ));
    }

    if labour.find_contraction(cmd.contraction_id).is_some() {
        return Err(LabourError::InvalidCommand(
            "Contraction already exists with ID".to_string(),
        ));
    }

    let mut events = vec![];

    if current_phase == &LabourPhase::PLANNED {
        events.push(LabourEvent::LabourBegun(LabourBegun {
            labour_id: cmd.labour_id,
            start_time: cmd.start_time,
        }));
        events.push(LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
            labour_id: cmd.labour_id,
            labour_phase: LabourPhase::EARLY,
        }));
    }

    events.push(LabourEvent::ContractionStarted(ContractionStarted {
        labour_id: cmd.labour_id,
        contraction_id: cmd.contraction_id,
        start_time: cmd.start_time,
    }));

    Ok(events)
}

pub fn handle_end_contraction(
    state: Option<&Labour>,
    cmd: EndContraction,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    if labour.phase() == &LabourPhase::COMPLETE {
        return Err(LabourError::InvalidCommand(
            "Cannot end contraction in completed labour".to_string(),
        ));
    }

    let Some(contraction) = labour.find_contraction(cmd.contraction_id) else {
        return Err(LabourError::InvalidCommand(
            "Contraction not found".to_string(),
        ));
    };

    if !contraction.is_active() {
        return Err(LabourError::InvalidCommand(
            "Contraction has already been ended".to_string(),
        ));
    }

    let contraction_ended = LabourEvent::ContractionEnded(ContractionEnded {
        labour_id: cmd.labour_id,
        contraction_id: cmd.contraction_id,
        end_time: cmd.end_time,
        intensity: cmd.intensity,
    });

    let mut updated_labour = labour.clone();
    updated_labour.apply(&contraction_ended);

    let mut events = vec![contraction_ended];

    if let Some(new_phase) = LabourPhaseProgression::evaluate(&updated_labour) {
        events.push(LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
            labour_id: cmd.labour_id,
            labour_phase: new_phase,
        }));
    }

    Ok(events)
}

pub fn handle_update_contraction(
    state: Option<&Labour>,
    cmd: UpdateContraction,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    if labour.phase() == &LabourPhase::COMPLETE {
        return Err(LabourError::InvalidCommand(
            "Cannot update contraction in completed labour".to_string(),
        ));
    }

    let Some(contraction) = labour.find_contraction(cmd.contraction_id) else {
        return Err(LabourError::InvalidCommand(
            "Contraction not found".to_string(),
        ));
    };

    if contraction.is_active() {
        return Err(LabourError::InvalidCommand(
            "Cannot update active contraction".to_string(),
        ));
    }

    if (cmd.start_time.is_some() || cmd.end_time.is_some())
        && labour.has_overlapping_contractions(cmd.contraction_id, cmd.start_time, cmd.end_time)
    {
        return Err(LabourError::ValidationError(
            "Updated contraction would overlap with existing contractions".to_string(),
        ));
    }

    let contraction_updated = LabourEvent::ContractionUpdated(ContractionUpdated {
        labour_id: cmd.labour_id,
        contraction_id: cmd.contraction_id,
        start_time: cmd.start_time,
        end_time: cmd.end_time,
        intensity: cmd.intensity,
    });

    let mut events = vec![contraction_updated.clone()];

    if cmd.intensity.is_some() || cmd.start_time.is_some() || cmd.end_time.is_some() {
        let mut updated_labour = labour.clone();
        updated_labour.apply(&contraction_updated);

        if let Some(new_phase) = LabourPhaseProgression::evaluate(&updated_labour) {
            events.push(LabourEvent::LabourPhaseChanged(LabourPhaseChanged {
                labour_id: cmd.labour_id,
                labour_phase: new_phase,
            }));
        }
    }

    Ok(events)
}

pub fn handle_delete_contraction(
    state: Option<&Labour>,
    cmd: DeleteContraction,
) -> Result<Vec<LabourEvent>, LabourError> {
    let Some(labour) = state else {
        return Err(LabourError::NotFound);
    };

    if labour.phase() == &LabourPhase::COMPLETE {
        return Err(LabourError::InvalidCommand(
            "Cannot delete contraction in completed labour".to_string(),
        ));
    }

    let Some(contraction) = labour.find_contraction(cmd.contraction_id) else {
        return Err(LabourError::InvalidCommand(
            "Contraction not found".to_string(),
        ));
    };

    if contraction.is_active() {
        return Err(LabourError::InvalidCommand(
            "Cannot delete active contraction".to_string(),
        ));
    }

    Ok(vec![LabourEvent::ContractionDeleted(ContractionDeleted {
        labour_id: cmd.labour_id,
        contraction_id: cmd.contraction_id,
    })])
}
