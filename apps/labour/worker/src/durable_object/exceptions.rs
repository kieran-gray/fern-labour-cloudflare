use tracing::error;

use crate::durable_object::{authorization::DenyReason, write_side::domain::LabourError};

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Forbidden(String),
    NotFound(String),
    Gone(String),
    Internal(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::BadRequest(msg) => write!(f, "{msg}"),
            AppError::Forbidden(msg) => write!(f, "{msg}"),
            AppError::NotFound(msg) => write!(f, "{msg}"),
            AppError::Gone(msg) => write!(f, "{msg}"),
            AppError::Internal(msg) => write!(f, "{msg}"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<AppError> for worker::Response {
    fn from(error: AppError) -> Self {
        let (msg, status) = match &error {
            AppError::BadRequest(msg) => (msg.as_str(), 400),
            AppError::Forbidden(msg) => (msg.as_str(), 403),
            AppError::NotFound(msg) => (msg.as_str(), 404),
            AppError::Gone(msg) => (msg.as_str(), 410),
            AppError::Internal(inner) => {
                error!("Internal error: {}", inner);
                ("An internal server error occurred", 500)
            }
        };
        worker::Response::error(msg, status).unwrap()
    }
}

impl From<LabourError> for AppError {
    fn from(err: LabourError) -> Self {
        match err {
            LabourError::NotFound => AppError::NotFound(err.to_string()),
            _ => AppError::BadRequest(err.to_string()),
        }
    }
}

impl From<DenyReason> for AppError {
    fn from(reason: DenyReason) -> Self {
        AppError::Forbidden(reason.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Internal(format!("Serialization error: {err}"))
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(format!("{err:#}"))
    }
}
