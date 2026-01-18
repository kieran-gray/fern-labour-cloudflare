/// Unified error type for the auth service.
/// Consolidates DomainError, RepositoryError, AppError, and AuthError into a single type.
#[derive(Debug, Clone)]
pub enum AuthError {
    /// JWT format or structure is invalid
    InvalidToken(String),

    /// Token claims validation failed (expired, invalid audience, etc.)
    InvalidClaims(String),

    /// Issuer URL not found in registry
    UnknownIssuer(String),

    /// Issuer configuration is invalid
    InvalidIssuer(String),

    /// Signature verification failed
    VerificationFailed(String),

    /// Failed to fetch or decode JWKS
    JwksFetchFailed(String),

    /// Identity extraction from claims failed
    ExtractionFailed(String),

    /// Unexpected internal error
    InternalError(String),
}

impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthError::InvalidToken(msg) => write!(f, "Invalid token: {msg}"),
            AuthError::InvalidClaims(msg) => write!(f, "Invalid claims: {msg}"),
            AuthError::UnknownIssuer(issuer) => write!(f, "Unknown issuer: {issuer}"),
            AuthError::InvalidIssuer(msg) => write!(f, "Invalid issuer: {msg}"),
            AuthError::VerificationFailed(msg) => write!(f, "Verification failed: {msg}"),
            AuthError::JwksFetchFailed(msg) => write!(f, "JWKS fetch failed: {msg}"),
            AuthError::ExtractionFailed(msg) => write!(f, "Extraction failed: {msg}"),
            AuthError::InternalError(msg) => write!(f, "Internal error: {msg}"),
        }
    }
}

impl std::error::Error for AuthError {}

impl AuthError {
    pub fn status_code(&self) -> u16 {
        match self {
            AuthError::InvalidToken(_) => 401,
            AuthError::InvalidClaims(_) => 401,
            AuthError::UnknownIssuer(_) => 401,
            AuthError::InvalidIssuer(_) => 500,
            AuthError::VerificationFailed(_) => 401,
            AuthError::JwksFetchFailed(_) => 500,
            AuthError::ExtractionFailed(_) => 500,
            AuthError::InternalError(_) => 500,
        }
    }
}

impl From<AuthError> for worker::Response {
    fn from(error: AuthError) -> Self {
        let status = error.status_code();
        let message = match status {
            500 => "Internal server error".to_string(),
            _ => error.to_string(),
        };
        worker::Response::error(&message, status).unwrap()
    }
}
