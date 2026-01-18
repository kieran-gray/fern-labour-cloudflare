use async_trait::async_trait;

use crate::domain::{AuthError, jwks::jwk::Jwk};

#[async_trait(?Send)]
pub trait JwksRepositoryTrait: Send + Sync {
    async fn get_jwk_by_key_id(&self, key_id: &str, issuer_url: &str) -> Result<Jwk, AuthError>;
}
