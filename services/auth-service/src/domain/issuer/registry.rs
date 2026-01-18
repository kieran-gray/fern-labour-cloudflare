use std::{collections::HashMap, sync::Arc};

use crate::domain::AuthError;

use super::entity::Issuer;

#[derive(Clone)]
pub struct IssuerRegistry {
    by_name: HashMap<String, Arc<Issuer>>,
    by_url: HashMap<String, Arc<Issuer>>,
}

impl IssuerRegistry {
    pub fn new(issuers: HashMap<String, Issuer>) -> Self {
        let mut by_name = HashMap::with_capacity(issuers.len());
        let mut by_url = HashMap::with_capacity(issuers.len());

        for (name, issuer) in issuers {
            let arc_issuer = Arc::new(issuer);
            by_url.insert(arc_issuer.url.clone(), Arc::clone(&arc_issuer));
            by_name.insert(name, arc_issuer);
        }

        Self { by_name, by_url }
    }

    pub fn find_by_url(&self, url: &str) -> Result<Arc<Issuer>, AuthError> {
        let normalized = if url.ends_with('/') {
            url.to_string()
        } else {
            format!("{}/", url)
        };

        self.by_url
            .get(&normalized)
            .cloned()
            .ok_or_else(|| AuthError::UnknownIssuer(url.to_string()))
    }

    pub fn get(&self, name: &str) -> Result<Arc<Issuer>, AuthError> {
        self.by_name
            .get(name)
            .cloned()
            .ok_or_else(|| AuthError::UnknownIssuer(name.to_string()))
    }

    pub fn is_trusted(&self, url: &str) -> bool {
        self.find_by_url(url).is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_issuer(name: &str, url: &str) -> Issuer {
        Issuer::new(
            name.to_string(),
            url.to_string(),
            ".well-known/jwks.json".to_string(),
            None,
        )
        .unwrap()
    }

    #[test]
    fn test_can_create_empty_registry() {
        let registry = IssuerRegistry::new(HashMap::new());
        assert!(registry.get("auth0").is_err());
    }

    #[test]
    fn test_can_add_and_get_issuer_by_name() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);
        let result = registry.get("auth0");

        assert!(result.is_ok());
        let found_issuer = result.unwrap();
        assert_eq!(found_issuer.name, "auth0");
        assert_eq!(found_issuer.url, "https://example.auth0.com/");
    }

    #[test]
    fn test_get_returns_error_for_unknown_name() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);
        let result = registry.get("unknown");

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::UnknownIssuer(name) => {
                assert_eq!(name, "unknown");
            }
            _ => panic!("Expected UnknownIssuer error"),
        }
    }

    #[test]
    fn test_can_find_issuer_by_url() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);
        let result = registry.find_by_url("https://example.auth0.com");

        assert!(result.is_ok());
        let found_issuer = result.unwrap();
        assert_eq!(found_issuer.name, "auth0");
    }

    #[test]
    fn test_find_by_url_normalizes_trailing_slash() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);

        assert!(registry.find_by_url("https://example.auth0.com").is_ok());
        assert!(registry.find_by_url("https://example.auth0.com/").is_ok());
    }

    #[test]
    fn test_find_by_url_returns_error_for_unknown_url() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);
        let result = registry.find_by_url("https://unknown.com");

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::UnknownIssuer(url) => {
                assert_eq!(url, "https://unknown.com");
            }
            _ => panic!("Expected UnknownIssuer error"),
        }
    }

    #[test]
    fn test_is_trusted_returns_true_for_known_issuer() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);
        assert!(registry.is_trusted("https://example.auth0.com"));
        assert!(registry.is_trusted("https://example.auth0.com/"));
    }

    #[test]
    fn test_is_trusted_returns_false_for_unknown_issuer() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);
        assert!(!registry.is_trusted("https://different.auth0.com"));
        assert!(!registry.is_trusted("https://different.auth0.com/"));
    }

    #[test]
    fn test_arc_allows_shared_ownership() {
        let mut issuers = HashMap::new();
        let issuer = create_test_issuer("auth0", "https://example.auth0.com");
        issuers.insert("auth0".to_string(), issuer);

        let registry = IssuerRegistry::new(issuers);

        let by_name = registry.get("auth0").unwrap();
        let by_url = registry.find_by_url("https://example.auth0.com").unwrap();

        // Both should point to the same Arc
        assert!(Arc::ptr_eq(&by_name, &by_url));
    }
}
