#[derive(Debug, Clone)]
pub enum AppError {
    ValidationError(String),
    ConsumerError(String),
    InternalError(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::ValidationError(e) => write!(f, "Validation error: {}", e),
            AppError::ConsumerError(e) => write!(f, "Consumer error: {}", e),
            AppError::InternalError(e) => write!(f, "Internal error: {}", e),
        }
    }
}

impl std::error::Error for AppError {}

impl From<AppError> for worker::Response {
    fn from(error: AppError) -> Self {
        let (msg, status) = match &error {
            AppError::ValidationError(err) => (err.clone(), 400),
            AppError::ConsumerError(err) => (err.clone(), 500),
            AppError::InternalError(err) => (err.clone(), 500),
        };
        worker::Response::error(&msg, status).unwrap()
    }
}

pub trait IntoWorkerResponse {
    fn into_response(self) -> worker::Response;
}

impl IntoWorkerResponse for anyhow::Error {
    fn into_response(self) -> worker::Response {
        if let Some(app_err) = self.downcast_ref::<AppError>() {
            return worker::Response::from(app_err.clone());
        }

        worker::Response::error(format!("{:#}", self), 500).unwrap()
    }
}
