use crate::domain::{AuthError, Jwk};

pub trait SignatureVerifierTrait: Send + Sync {
    fn verify_signature(&self, token: &str, jwk: &Jwk) -> Result<serde_json::Value, AuthError>;
}
