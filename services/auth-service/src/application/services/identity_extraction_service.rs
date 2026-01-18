use std::collections::HashMap;

use crate::domain::{AuthError, AuthenticatedPrincipal, TokenClaims};

pub trait IdentityExtractionServiceTrait: Send + Sync {
    fn extract_principal(
        &self,
        claims: &TokenClaims,
        issuer_name: &str,
    ) -> Result<AuthenticatedPrincipal, AuthError>;
}

pub struct IdentityExtractionService {
    extractors: HashMap<String, Box<dyn ClaimsExtractor>>,
}

impl IdentityExtractionService {
    pub fn create(extractors: HashMap<String, Box<dyn ClaimsExtractor>>) -> Self {
        Self { extractors }
    }
}

impl IdentityExtractionService {
    fn get_extractor(&self, issuer: &str) -> Option<&dyn ClaimsExtractor> {
        self.extractors.get(issuer).map(|b| b.as_ref())
    }
}

impl IdentityExtractionServiceTrait for IdentityExtractionService {
    fn extract_principal(
        &self,
        claims: &TokenClaims,
        issuer_name: &str,
    ) -> Result<AuthenticatedPrincipal, AuthError> {
        let extractor = self
            .get_extractor(issuer_name)
            .ok_or(AuthError::ExtractionFailed(format!(
                "No extractor for {}",
                issuer_name
            )))?;

        AuthenticatedPrincipal::new(
            claims.subject.to_string(),
            claims.issuer.to_string(),
            extractor.extract_email(&claims.custom_claims),
            extractor.extract_email_verified(&claims.custom_claims),
            extractor.extract_phone_number(&claims.custom_claims),
            extractor.extract_phone_number_verified(&claims.custom_claims),
            extractor.extract_first_name(&claims.custom_claims),
            extractor.extract_last_name(&claims.custom_claims),
            extractor.extract_name(&claims.custom_claims),
            claims.custom_claims.clone(),
        )
    }
}

pub trait ClaimsExtractor: Send + Sync {
    fn extract_email(&self, claims: &serde_json::Value) -> Option<String>;
    fn extract_email_verified(&self, claims: &serde_json::Value) -> Option<bool>;
    fn extract_phone_number(&self, claims: &serde_json::Value) -> Option<String>;
    fn extract_phone_number_verified(&self, claims: &serde_json::Value) -> Option<String>;
    fn extract_first_name(&self, claims: &serde_json::Value) -> Option<String>;
    fn extract_last_name(&self, claims: &serde_json::Value) -> Option<String>;
    fn extract_name(&self, claims: &serde_json::Value) -> Option<String>;
    fn extract_roles(&self, claims: &serde_json::Value) -> Vec<String>;
}
