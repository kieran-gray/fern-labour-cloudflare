use crate::domain::{AuthError, JwtAlgorithm};

#[derive(Debug, Clone)]
pub struct JwtHeader {
    pub algorithm: JwtAlgorithm,
    pub key_id: String,
}

impl JwtHeader {
    pub fn new(algorithm: String, key_id: String) -> Result<Self, AuthError> {
        if algorithm.is_empty() {
            return Err(AuthError::InvalidToken("Empty algorithm".into()));
        }
        let Ok(algorithm) = algorithm.parse() else {
            return Err(AuthError::InvalidToken(format!(
                "Unsupported algorithm: {}",
                algorithm
            )));
        };

        Ok(Self { algorithm, key_id })
    }
}

#[derive(Debug)]
pub struct UnverifiedJwt {
    pub header: JwtHeader,
    pub raw_token: String,
}

impl UnverifiedJwt {
    pub fn new(header: JwtHeader, raw_token: String) -> Self {
        Self { header, raw_token }
    }

    pub fn key_id(&self) -> &str {
        &self.header.key_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_create_header_with_rs256() {
        let result = JwtHeader::new("RS256".to_string(), "test-key-id".to_string());

        assert!(result.is_ok());
        let header = result.unwrap();
        assert_eq!(header.algorithm, JwtAlgorithm::RS256);
        assert_eq!(header.key_id, "test-key-id");
    }

    #[test]
    fn test_cannot_create_header_with_unsupported_algorithm() {
        let result = JwtHeader::new("HS256".to_string(), "test-key-id".to_string());

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidToken(msg) => {
                assert!(msg.contains("Unsupported algorithm"));
                assert!(msg.contains("HS256"));
            }
            _ => panic!("Expected InvalidToken error"),
        }
    }

    #[test]
    fn test_cannot_create_header_with_empty_algorithm() {
        let result = JwtHeader::new("".to_string(), "test-key-id".to_string());

        assert!(result.is_err());
        match result.unwrap_err() {
            AuthError::InvalidToken(msg) => {
                assert!(msg.contains("Empty algorithm"));
            }
            _ => panic!("Expected InvalidToken error"),
        }
    }

    #[test]
    fn test_can_create_unverified_jwt() {
        let header = JwtHeader::new("RS256".to_string(), "test-key-id".to_string()).unwrap();
        let raw_token = "eyJhbGc...".to_string();

        let jwt = UnverifiedJwt::new(header.clone(), raw_token.clone());

        assert_eq!(jwt.header.algorithm, header.algorithm);
        assert_eq!(jwt.header.key_id, header.key_id);
        assert_eq!(jwt.raw_token, raw_token);
    }

    #[test]
    fn test_key_id_accessor_returns_correct_value() {
        let header = JwtHeader::new("RS256".to_string(), "my-key-123".to_string()).unwrap();
        let jwt = UnverifiedJwt::new(header, "token".to_string());

        assert_eq!(jwt.key_id(), "my-key-123");
    }
}
