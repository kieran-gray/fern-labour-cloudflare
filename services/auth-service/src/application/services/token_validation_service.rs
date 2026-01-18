use std::sync::Arc;

use async_trait::async_trait;

use crate::{
    application::{jwt_parser::JwtParserTrait, signature_verifier::SignatureVerifierTrait},
    domain::{
        AuthError, Issuer, IssuerRegistry, JwksRepositoryTrait, TokenClaims,
        services::token_validator::TokenValidator,
    },
};

#[async_trait(?Send)]
pub trait TokenValidationServiceTrait: Send + Sync {
    async fn validate_token(&self, token: &str) -> Result<(TokenClaims, Arc<Issuer>), AuthError>;
}

pub struct TokenValidationService {
    jwks_repository: Arc<dyn JwksRepositoryTrait>,
    issuer_registry: IssuerRegistry,
    signature_verifier: Arc<dyn SignatureVerifierTrait>,
    jwt_parser: Arc<dyn JwtParserTrait>,
}

impl TokenValidationService {
    pub fn create(
        jwks_repository: Arc<dyn JwksRepositoryTrait>,
        issuer_registry: IssuerRegistry,
        signature_verifier: Arc<dyn SignatureVerifierTrait>,
        jwt_parser: Arc<dyn JwtParserTrait>,
    ) -> Self {
        Self {
            jwks_repository,
            issuer_registry,
            signature_verifier,
            jwt_parser,
        }
    }
}

#[async_trait(?Send)]
impl TokenValidationServiceTrait for TokenValidationService {
    async fn validate_token(&self, token: &str) -> Result<(TokenClaims, Arc<Issuer>), AuthError> {
        let unverified_jwt = self.jwt_parser.parse_unverified_jwt(token)?;

        let issuer_url = self
            .jwt_parser
            .extract_issuer_from_unverified(&unverified_jwt)?;

        let issuer = self.issuer_registry.find_by_url(&issuer_url)?;

        let jwk = self
            .jwks_repository
            .get_jwk_by_key_id(unverified_jwt.key_id(), &issuer.jwks_url())
            .await?;

        let validated_payload = self
            .signature_verifier
            .verify_signature(&unverified_jwt.raw_token, &jwk)?;

        let claims = self.jwt_parser.extract_claims(&validated_payload)?;

        let current_time = chrono::Utc::now().timestamp();
        TokenValidator::validate_claims(&claims, &issuer, current_time)?;

        Ok((claims, issuer))
    }
}
