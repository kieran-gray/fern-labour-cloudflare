#[derive(Debug, Clone)]
pub enum LabourError {
    NotFound,
    InvalidStateTransition(String, String),
    ValidationError(String),
    InvalidCommand(String),
}

impl std::fmt::Display for LabourError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LabourError::NotFound => write!(f, "Labour not found"),
            LabourError::InvalidStateTransition(from_state, _) => {
                write!(
                    f,
                    "This action is not available during the {from_state} phase"
                )
            }
            LabourError::ValidationError(msg) => write!(f, "{msg}"),
            LabourError::InvalidCommand(msg) => write!(f, "{msg}"),
        }
    }
}

impl std::error::Error for LabourError {}
