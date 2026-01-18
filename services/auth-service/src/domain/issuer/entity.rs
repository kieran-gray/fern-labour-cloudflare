use crate::domain::{AuthError, TokenClaims};

#[derive(Debug, Clone)]
pub struct Issuer {
    pub name: String,
    pub url: String,
    pub jwks_path: String,
    pub expected_audience: Option<String>,
}

impl Issuer {
    pub fn new(
        name: String,
        url: String,
        jwks_path: String,
        expected_audience: Option<String>,
    ) -> Result<Self, AuthError> {
        if name.is_empty() {
            return Err(AuthError::InvalidIssuer("Empty name".into()));
        }
        if !url.starts_with("https://") && !url.starts_with("http://") {
            return Err(AuthError::InvalidIssuer(format!("Invalid URL: {}", url)));
        }

        let normalized_url = if url.ends_with('/') {
            url
        } else {
            format!("{}/", url)
        };

        Ok(Self {
            name,
            url: normalized_url,
            jwks_path,
            expected_audience,
        })
    }

    pub fn jwks_url(&self) -> String {
        format!("{}{}", self.url, self.jwks_path)
    }

    pub fn matches_url(&self, url: &str) -> bool {
        let normalized = if url.ends_with('/') {
            url.to_string()
        } else {
            format!("{}/", url)
        };
        self.url == normalized
    }

    pub fn validate_audience(&self, claims: &TokenClaims) -> Result<(), AuthError> {
        match &self.expected_audience {
            Some(expected) => claims.validate_audience(expected),
            None => Ok(()),
        }
    }

    pub fn requires_audience(&self) -> bool {
        self.expected_audience.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_can_create_issuer_with_valid_url() {
        let result = Issuer::new(
            "auth0".to_string(),
            "https://example.auth0.com".to_string(),
            ".well-known/jwks.json".to_string(),
            Some("https://api.example.com".to_string()),
        );

        assert!(result.is_ok());
        let issuer = result.unwrap();
        assert_eq!(issuer.name, "auth0");
        assert_eq!(issuer.url, "https://example.auth0.com/");
        assert_eq!(issuer.jwks_path, ".well-known/jwks.json");
        assert_eq!(
            issuer.expected_audience,
            Some("https://api.example.com".to_string())
        );
    }

    #[test]
    fn test_cannot_create_issuer_with_invalid_scheme() {
        let result = Issuer::new(
            "invalid".to_string(),
            "ftp://example.com".to_string(),
            "jwks".to_string(),
            None,
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidIssuer(msg) => {
                assert!(msg.contains("Invalid URL"));
                assert!(msg.contains("ftp://example.com"));
            }
            _ => panic!("Expected InvalidIssuer error"),
        }
    }

    #[test]
    fn test_cannot_create_issuer_with_empty_name() {
        let result = Issuer::new(
            "".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            None,
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidIssuer(msg) => {
                assert_eq!(msg, "Empty name");
            }
            _ => panic!("Expected InvalidIssuer error"),
        }
    }

    #[test]
    fn test_normalizes_url_with_trailing_slash() {
        let result = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            None,
        );

        assert!(result.is_ok());
        let issuer = result.unwrap();
        assert_eq!(issuer.url, "https://example.com/");
    }

    #[test]
    fn test_matches_url_with_normalization() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            None,
        )
        .unwrap();

        assert!(issuer.matches_url("https://example.com/"));
        assert!(issuer.matches_url("https://example.com"));
    }

    #[test]
    fn test_does_not_match_different_url() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            None,
        )
        .unwrap();

        assert!(!issuer.matches_url("https://different.com"));
    }

    #[test]
    fn test_jwks_url_concatenation() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            ".well-known/jwks.json".to_string(),
            None,
        )
        .unwrap();

        assert_eq!(
            issuer.jwks_url(),
            "https://example.com/.well-known/jwks.json"
        );
    }

    #[test]
    fn test_requires_audience_when_configured() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            Some("https://api.example.com".to_string()),
        )
        .unwrap();

        assert!(issuer.requires_audience());
    }

    #[test]
    fn test_does_not_require_audience_when_none() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            None,
        )
        .unwrap();

        assert!(!issuer.requires_audience());
    }

    #[test]
    fn test_validate_audience_passes_when_matched() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            Some("https://api.example.com".to_string()),
        )
        .unwrap();

        let claims = TokenClaims::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some(vec!["https://api.example.com".to_string()]),
            None,
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();

        let result = issuer.validate_audience(&claims);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_audience_fails_when_mismatched() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            Some("https://api.example.com".to_string()),
        )
        .unwrap();

        let claims = TokenClaims::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            Some(vec!["https://different-api.example.com".to_string()]),
            None,
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();

        let result = issuer.validate_audience(&claims);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_audience_passes_when_not_required() {
        let issuer = Issuer::new(
            "test".to_string(),
            "https://example.com".to_string(),
            "jwks".to_string(),
            None,
        )
        .unwrap();

        let claims = TokenClaims::new(
            "user123".to_string(),
            "https://example.com/".to_string(),
            None,
            None,
            None,
            None,
            None,
            json!({}),
        )
        .unwrap();

        let result = issuer.validate_audience(&claims);
        assert!(result.is_ok());
    }
}
