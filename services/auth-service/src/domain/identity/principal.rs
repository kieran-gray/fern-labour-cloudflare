use crate::domain::exceptions::DomainError;

#[derive(Debug, Clone)]
pub struct AuthenticatedPrincipal {
    pub identity_id: String,
    pub issuer: String,
    pub email: Option<String>,
    pub email_verified: Option<bool>,
    pub phone_number: Option<String>,
    pub phone_number_verified: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub name: Option<String>,
    pub metadata: serde_json::Value,
}

impl AuthenticatedPrincipal {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        identity_id: String,
        issuer: String,
        email: Option<String>,
        email_verified: Option<bool>,
        phone_number: Option<String>,
        phone_number_verified: Option<String>,
        first_name: Option<String>,
        last_name: Option<String>,
        name: Option<String>,
        metadata: serde_json::Value,
    ) -> Result<Self, DomainError> {
        if identity_id.is_empty() {
            return Err(DomainError::InvalidIdentity("Empty identity_id".into()));
        }
        if issuer.is_empty() {
            return Err(DomainError::InvalidIdentity("Empty issuer".into()));
        }
        Ok(Self {
            identity_id,
            issuer,
            email,
            email_verified,
            phone_number,
            phone_number_verified,
            first_name,
            last_name,
            name,
            metadata,
        })
    }

    pub fn has_verified_email(&self) -> bool {
        self.email.is_some() && self.email_verified.unwrap_or(false)
    }

    pub fn is_from_issuer(&self, issuer_url: &str) -> bool {
        self.issuer == issuer_url
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_can_create_principal_with_valid_data() {
        let metadata = json!({"roles": ["admin"]});
        let result = AuthenticatedPrincipal::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some("user@example.com".to_string()),
            Some(true),
            Some("+1234567890".to_string()),
            Some("true".to_string()),
            Some("John".to_string()),
            Some("Doe".to_string()),
            Some("John Doe".to_string()),
            metadata.clone(),
        );

        assert!(result.is_ok());
        let principal = result.unwrap();
        assert_eq!(principal.identity_id, "user123");
        assert_eq!(principal.issuer, "https://example.com/");
        assert_eq!(principal.email, Some("user@example.com".to_string()));
        assert_eq!(principal.email_verified, Some(true));
        assert_eq!(principal.name, Some("John Doe".to_string()));
        assert_eq!(principal.metadata, metadata);
    }

    #[test]
    fn test_cannot_create_principal_with_empty_identity_id() {
        let result = AuthenticatedPrincipal::new(
            "".to_string(),
            "https://example.com/".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            json!({}),
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::InvalidIdentity(msg) => {
                assert_eq!(msg, "Empty identity_id");
            }
            _ => panic!("Expected InvalidIdentity error"),
        }
    }

    #[test]
    fn test_cannot_create_principal_with_empty_issuer() {
        let result = AuthenticatedPrincipal::new(
            "user123".to_string(),
            "".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            json!({}),
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::InvalidIdentity(msg) => {
                assert_eq!(msg, "Empty issuer");
            }
            _ => panic!("Expected InvalidIdentity error"),
        }
    }

    #[test]
    fn test_has_verified_email_when_email_verified() {
        let principal = AuthenticatedPrincipal::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some("user@example.com".to_string()),
            Some(true),
            None,
            None,
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();

        assert!(principal.has_verified_email());
    }

    #[test]
    fn test_does_not_have_verified_email_when_not_verified() {
        let principal = AuthenticatedPrincipal::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some("user@example.com".to_string()),
            Some(false),
            None,
            None,
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();

        assert!(!principal.has_verified_email());
    }

    #[test]
    fn test_is_from_issuer_matches() {
        let principal = AuthenticatedPrincipal::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();

        assert!(principal.is_from_issuer("https://example.com/"));
        assert!(!principal.is_from_issuer("https://example.com"));
    }

    #[test]
    fn test_is_from_issuer_does_not_match() {
        let principal = AuthenticatedPrincipal::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();

        assert!(!principal.is_from_issuer("https://different.com/"));
    }

    #[test]
    fn test_metadata_preserved() {
        let metadata = json!({
            "roles": ["admin", "user"],
            "organization": "Example Inc",
            "permissions": {
                "read": true,
                "write": true
            }
        });

        let principal = AuthenticatedPrincipal::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            metadata.clone(),
        )
        .unwrap();

        assert_eq!(principal.metadata, metadata);
        assert_eq!(principal.metadata["roles"][0], "admin");
        assert_eq!(principal.metadata["organization"], "Example Inc");
        assert_eq!(principal.metadata["permissions"]["read"], true);
    }
}
