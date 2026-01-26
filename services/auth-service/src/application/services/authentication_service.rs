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
    domain::{AuthError, Issuer},
};

#[async_trait(?Send)]
pub trait AuthenticationServiceTrait: Send + Sync {
    async fn authenticate(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<UserDto, AuthError>;
    async fn get_user_id(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<String, AuthError>;
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

    fn validate_issuer_allowed(
        &self,
        issuer: &Issuer,
        allowed: &Vec<String>,
    ) -> Result<(), AuthError> {
        match allowed.as_slice() {
            [] => Ok(()),
            issuers if issuers.contains(&issuer.name) => Ok(()),
            _ => Err(AuthError::IssuerNotAllowed(issuer.name.clone())),
        }
    }
}

#[async_trait(?Send)]
impl AuthenticationServiceTrait for AuthenticationService {
    async fn authenticate(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<UserDto, AuthError> {
        let (claims, issuer) = self.validator.validate_token(token).await.map_err(|e| {
            error!(error = %e, "Token validation failed");
            e
        })?;

        self.validate_issuer_allowed(&issuer, &allowed_issuers)?;

        let principal = self
            .extractor
            .extract_principal(&claims, &issuer.name)
            .map_err(|e| {
                error!(error = %e, "Principal extraction failed");
                e
            })?;

        Ok(UserDto::from(principal))
    }

    async fn get_user_id(
        &self,
        token: &str,
        allowed_issuers: Vec<String>,
    ) -> Result<String, AuthError> {
        let (claims, issuer) = self.validator.validate_token(token).await.map_err(|e| {
            error!(error = %e, "Token validation failed");
            e
        })?;

        self.validate_issuer_allowed(&issuer, &allowed_issuers)?;

        Ok(claims.subject)
    }
}
