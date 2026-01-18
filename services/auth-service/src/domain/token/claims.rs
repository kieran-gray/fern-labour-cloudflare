use crate::domain::AuthError;

#[derive(Debug, Clone)]
pub struct TokenClaims {
    pub subject: String,
    pub issuer: String,
    pub audience: Option<Vec<String>>,
    pub expiration: Option<i64>,
    pub issued_at: Option<i64>,
    pub not_before: Option<i64>,
    pub jwt_id: Option<String>,
    pub custom_claims: serde_json::Value,
}

impl TokenClaims {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        subject: String,
        issuer: String,
        audience: Option<Vec<String>>,
        expiration: Option<i64>,
        issued_at: Option<i64>,
        not_before: Option<i64>,
        jwt_id: Option<String>,
        custom_claims: serde_json::Value,
    ) -> Result<Self, AuthError> {
        if subject.is_empty() {
            return Err(AuthError::InvalidClaims("Empty subject".into()));
        }
        if issuer.is_empty() {
            return Err(AuthError::InvalidClaims("Empty issuer".into()));
        }
        Ok(Self {
            subject,
            issuer,
            audience,
            expiration,
            issued_at,
            not_before,
            jwt_id,
            custom_claims,
        })
    }

    pub fn is_expired(&self, current_time: i64) -> bool {
        self.expiration.is_some_and(|exp| exp < current_time)
    }

    pub fn is_not_yet_valid(&self, current_time: i64) -> bool {
        self.not_before.is_some_and(|nbf| nbf > current_time)
    }

    pub fn has_audience(&self, expected: &str) -> bool {
        self.audience
            .as_ref()
            .is_some_and(|aud| aud.iter().any(|a| a == expected))
    }

    pub fn validate_time_constraints(&self, current_time: i64) -> Result<(), AuthError> {
        if self.is_expired(current_time) {
            return Err(AuthError::InvalidClaims("Token expired".into()));
        };
        if self.is_not_yet_valid(current_time) {
            return Err(AuthError::InvalidClaims("Token not yet valid".into()));
        };
        Ok(())
    }

    pub fn validate_audience(&self, expected: &str) -> Result<(), AuthError> {
        match &self.audience {
            Some(_aud) if self.has_audience(expected) => Ok(()),
            Some(aud) => Err(AuthError::InvalidClaims(format!(
                "Invalid audience: expected '{}', got {:?}",
                expected, aud
            ))),
            None => Ok(()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn create_test_claims() -> TokenClaims {
        TokenClaims::new(
            "user123".to_string(),
            "https://issuer.example.com/".to_string(),
            Some(vec!["https://api.example.com".to_string()]),
            Some(9999999999),
            Some(1000000000),
            None,
            None,
            json!({}),
        )
        .unwrap()
    }

    #[test]
    fn test_can_create_valid_token_claims() {
        let claims = TokenClaims::new(
            "user123".to_string(),
            "https://issuer.example.com/".to_string(),
            Some(vec!["https://api.example.com".to_string()]),
            Some(1234567890),
            Some(1234567800),
            Some(1234567700),
            Some("jwt-id-123".to_string()),
            json!({"email": "user@example.com"}),
        );

        assert!(claims.is_ok());
        let claims = claims.unwrap();
        assert_eq!(claims.subject, "user123");
        assert_eq!(claims.issuer, "https://issuer.example.com/");
        assert_eq!(
            claims.audience,
            Some(vec!["https://api.example.com".to_string()])
        );
        assert_eq!(claims.expiration, Some(1234567890));
        assert_eq!(claims.issued_at, Some(1234567800));
        assert_eq!(claims.not_before, Some(1234567700));
        assert_eq!(claims.jwt_id, Some("jwt-id-123".to_string()));
    }

    #[test]
    fn test_cannot_create_claims_with_empty_subject() {
        let result = TokenClaims::new(
            "".to_string(),
            "https://issuer.example.com/".to_string(),
            None,
            None,
            None,
            None,
            None,
            json!({}),
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => assert!(msg.contains("Empty subject")),
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_cannot_create_claims_with_empty_issuer() {
        let result = TokenClaims::new(
            "user123".to_string(),
            "".to_string(),
            None,
            None,
            None,
            None,
            None,
            json!({}),
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => assert!(msg.contains("Empty issuer")),
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_is_not_expired_when_no_expiration() {
        let mut claims = create_test_claims();
        claims.expiration = None;

        assert!(!claims.is_expired(9999999999));
        assert!(!claims.is_expired(0));
    }

    #[test]
    fn test_is_expired_when_past_expiration() {
        let mut claims = create_test_claims();
        claims.expiration = Some(1000000000);

        assert!(claims.is_expired(1000000001));
        assert!(claims.is_expired(2000000000));
    }

    #[test]
    fn test_is_not_expired_when_before_expiration() {
        let mut claims = create_test_claims();
        claims.expiration = Some(2000000000);

        assert!(!claims.is_expired(1999999999));
        assert!(!claims.is_expired(1000000000));
    }

    #[test]
    fn test_is_not_yet_valid_when_before_nbf() {
        let mut claims = create_test_claims();
        claims.not_before = Some(2000000000);

        assert!(claims.is_not_yet_valid(1999999999));
        assert!(claims.is_not_yet_valid(1000000000));
    }

    #[test]
    fn test_is_valid_when_after_nbf() {
        let mut claims = create_test_claims();
        claims.not_before = Some(1000000000);

        assert!(!claims.is_not_yet_valid(1000000001));
        assert!(!claims.is_not_yet_valid(2000000000));
    }

    #[test]
    fn test_is_valid_when_no_nbf() {
        let mut claims = create_test_claims();
        claims.not_before = None;

        assert!(!claims.is_not_yet_valid(0));
        assert!(!claims.is_not_yet_valid(9999999999));
    }

    #[test]
    fn test_has_audience_when_in_list() {
        let mut claims = create_test_claims();
        claims.audience = Some(vec![
            "https://api1.example.com".to_string(),
            "https://api2.example.com".to_string(),
            "https://api3.example.com".to_string(),
        ]);

        assert!(claims.has_audience("https://api2.example.com"));
        assert!(claims.has_audience("https://api1.example.com"));
        assert!(claims.has_audience("https://api3.example.com"));
    }

    #[test]
    fn test_does_not_have_audience_when_missing() {
        let claims = create_test_claims();

        assert!(!claims.has_audience("https://different-api.example.com"));
        assert!(!claims.has_audience(""));
    }

    #[test]
    fn test_validate_time_constraints_passes_when_valid() {
        let mut claims = create_test_claims();
        claims.expiration = Some(2000000000);
        claims.not_before = Some(1000000000);

        let result = claims.validate_time_constraints(1500000000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_time_constraints_fails_when_expired() {
        let mut claims = create_test_claims();
        claims.expiration = Some(1000000000);

        let result = claims.validate_time_constraints(1000000001);
        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => assert!(msg.contains("expired")),
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_validate_time_constraints_fails_when_not_yet_valid() {
        let mut claims = create_test_claims();
        claims.not_before = Some(2000000000);

        let result = claims.validate_time_constraints(1000000000);
        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => assert!(msg.contains("not yet valid")),
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_validate_audience_passes_when_matched() {
        let claims = create_test_claims();

        let result = claims.validate_audience("https://api.example.com");
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_audience_passes_when_no_audience() {
        let mut claims = create_test_claims();
        claims.audience = None;

        let result = claims.validate_audience("https://api.example.com");
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_audience_fails_when_mismatched() {
        let claims = create_test_claims();

        let result = claims.validate_audience("https://different-api.example.com");
        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidClaims(msg) => {
                assert!(msg.contains("Invalid audience"));
                assert!(msg.contains("different-api.example.com"));
            }
            _ => panic!("Expected InvalidClaims error"),
        }
    }

    #[test]
    fn test_validate_audience_passes_when_in_multiple_audiences() {
        let mut claims = create_test_claims();
        claims.audience = Some(vec![
            "https://api1.example.com".to_string(),
            "https://api2.example.com".to_string(),
        ]);

        let result1 = claims.validate_audience("https://api1.example.com");
        assert!(result1.is_ok());

        let result2 = claims.validate_audience("https://api2.example.com");
        assert!(result2.is_ok());
    }

    #[test]
    fn test_custom_claims_preserved() {
        let custom = json!({
            "email": "user@example.com",
            "roles": ["admin", "user"],
            "metadata": {
                "company": "Example Inc"
            }
        });

        let claims = TokenClaims::new(
            "user123".to_string(),
            "https://issuer.example.com/".to_string(),
            None,
            None,
            None,
            None,
            None,
            custom.clone(),
        )
        .unwrap();

        assert_eq!(claims.custom_claims, custom);
        assert_eq!(claims.custom_claims["email"], "user@example.com");
        assert_eq!(claims.custom_claims["roles"][0], "admin");
    }
}
