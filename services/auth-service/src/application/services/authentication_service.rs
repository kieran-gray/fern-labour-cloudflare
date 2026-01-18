use std::sync::Arc;
use tracing::error;

use async_trait::async_trait;

use crate::{
    application::{
        dtos::user::UserDto,
        services::{
            identity_extraction_service::IdentityExtractionServiceTrait,
            token_validation_service::TokenValidationServiceTrait,
        },
    },
    domain::AuthError,
};

#[async_trait(?Send)]
pub trait AuthenticationServiceTrait: Send + Sync {
    async fn authenticate(&self, token: &str) -> Result<UserDto, AuthError>;
    async fn get_user_id(&self, token: &str) -> Result<String, AuthError>;
}

pub struct AuthenticationService {
    validator: Arc<dyn TokenValidationServiceTrait>,
    extractor: Arc<dyn IdentityExtractionServiceTrait>,
}

impl AuthenticationService {
    pub fn create(
        validator: Arc<dyn TokenValidationServiceTrait>,
        extractor: Arc<dyn IdentityExtractionServiceTrait>,
    ) -> Self {
        Self {
            validator,
            extractor,
        }
    }
}

#[async_trait(?Send)]
impl AuthenticationServiceTrait for AuthenticationService {
    async fn authenticate(&self, token: &str) -> Result<UserDto, AuthError> {
        let (claims, issuer) = self.validator.validate_token(token).await.map_err(|e| {
            error!(error = %e, "Token validation failed");
            e
        })?;

        let principal = self
            .extractor
            .extract_principal(&claims, &issuer.name)
            .map_err(|e| {
                error!(error = %e, "Principal extraction failed");
                e
            })?;

        Ok(UserDto::from(principal))
    }

    async fn get_user_id(&self, token: &str) -> Result<String, AuthError> {
        let (claims, _issuer) = self.validator.validate_token(token).await.map_err(|e| {
            error!(error = %e, "Token validation failed");
            e
        })?;

        Ok(claims.subject)
    }
}
