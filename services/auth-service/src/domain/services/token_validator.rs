use crate::domain::{AuthError, Issuer, TokenClaims};

pub struct TokenValidator;

impl TokenValidator {
    pub fn validate_claims(
        claims: &TokenClaims,
        issuer: &Issuer,
        current_time: i64,
    ) -> Result<(), AuthError> {
        claims.validate_time_constraints(current_time)?;
        issuer.validate_audience(claims)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn create_test_claims_with_time(exp: Option<i64>, nbf: Option<i64>) -> TokenClaims {
        TokenClaims::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some(vec!["https://api.example.com".to_string()]),
            exp,
            None,
            nbf,
            None,
            json!({}),
        )
        .unwrap()
    }

    fn create_test_issuer(expected_audience: Option<String>) -> Issuer {
        Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            ".well-known/jwks.json".to_string(),
            expected_audience,
        )
        .unwrap()
    }

    #[test]
    fn test_validate_claims_passes_with_valid_token() {
        let claims = create_test_claims_with_time(Some(2000000000), Some(1000000000));
        let issuer = create_test_issuer(Some("https://api.example.com".to_string()));

        let result = TokenValidator::validate_claims(&claims, &issuer, 1500000000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_claims_passes_with_no_time_constraints() {
        let claims = create_test_claims_with_time(None, None);
        let issuer = create_test_issuer(Some("https://api.example.com".to_string()));

        let result = TokenValidator::validate_claims(&claims, &issuer, 1500000000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_claims_passes_with_no_audience_requirement() {
        let claims = create_test_claims_with_time(Some(2000000000), None);
        let issuer = create_test_issuer(None);

        let result = TokenValidator::validate_claims(&claims, &issuer, 1500000000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_claims_fails_when_token_expired() {
        let claims = create_test_claims_with_time(Some(1000000000), None);
        let issuer = create_test_issuer(Some("https://api.example.com".to_string()));

        let result = TokenValidator::validate_claims(&claims, &issuer, 1000000001);
        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => {
                assert!(msg.contains("expired"));
            }
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_validate_claims_fails_when_token_not_yet_valid() {
        let claims = create_test_claims_with_time(Some(9999999999), Some(2000000000));
        let issuer = create_test_issuer(Some("https://api.example.com".to_string()));

        let result = TokenValidator::validate_claims(&claims, &issuer, 1000000000);
        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => {
                assert!(msg.contains("not yet valid"));
            }
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_validate_claims_fails_when_audience_mismatch() {
        let claims = TokenClaims::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some(vec!["https://different-api.example.com".to_string()]),
            Some(9999999999),
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();
        let issuer = create_test_issuer(Some("https://api.example.com".to_string()));

        let result = TokenValidator::validate_claims(&claims, &issuer, 1500000000);
        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => {
                assert!(msg.contains("Invalid audience"));
            }
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_validate_claims_passes_when_audience_matches_one_of_many() {
        let claims = TokenClaims::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some(vec![
                "https://api1.example.com".to_string(),
                "https://api.example.com".to_string(),
                "https://api2.example.com".to_string(),
            ]),
            Some(9999999999),
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();
        let issuer = create_test_issuer(Some("https://api.example.com".to_string()));

        let result = TokenValidator::validate_claims(&claims, &issuer, 1500000000);
        assert!(result.is_ok());
    }
}
