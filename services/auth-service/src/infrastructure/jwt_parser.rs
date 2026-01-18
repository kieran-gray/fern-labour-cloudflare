use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};

use crate::{
    application::jwt_parser::JwtParserTrait,
    domain::{AuthError, JwtHeader, TokenClaims, UnverifiedJwt},
};

pub struct JwtParser;

impl JwtParser {
    fn parse_header(header_b64: &str) -> Result<JwtHeader, AuthError> {
        let header_bytes = URL_SAFE_NO_PAD
            .decode(header_b64)
            .map_err(|e| AuthError::InvalidToken(format!("Invalid header encoding: {e}")))?;

        let header_json: serde_json::Value = serde_json::from_slice(&header_bytes)
            .map_err(|e| AuthError::InvalidToken(format!("Invalid header JSON: {e}")))?;

        let algorithm = header_json
            .get("alg")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AuthError::InvalidToken("Missing alg in header".into()))?
            .to_string();

        let key_id = header_json
            .get("kid")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AuthError::InvalidToken("Missing kid in header".into()))?
            .to_string();

        JwtHeader::new(algorithm, key_id)
    }
}

impl JwtParserTrait for JwtParser {
    fn parse_unverified_jwt(&self, token: &str) -> Result<UnverifiedJwt, AuthError> {
        let token = token.strip_prefix("Bearer ").unwrap_or(token);

        let parts: Vec<&str> = token.split('.').collect();
        if parts.len() != 3 {
            return Err(AuthError::InvalidToken("Invalid JWT format".into()));
        }

        let header = Self::parse_header(parts[0])?;

        Ok(UnverifiedJwt::new(header, token.to_string()))
    }

    fn extract_issuer_from_unverified(&self, jwt: &UnverifiedJwt) -> Result<String, AuthError> {
        let parts: Vec<&str> = jwt.raw_token.split('.').collect();
        let payload_bytes = URL_SAFE_NO_PAD
            .decode(parts[1])
            .map_err(|e| AuthError::InvalidToken(format!("Invalid payload encoding: {}", e)))?;

        let payload: serde_json::Value = serde_json::from_slice(&payload_bytes)
            .map_err(|e| AuthError::InvalidToken(format!("Invalid payload JSON: {}", e)))?;

        payload
            .get("iss")
            .and_then(|v| v.as_str())
            .map(String::from)
            .ok_or_else(|| AuthError::InvalidClaims("Missing iss claim".into()))
    }

    fn extract_claims(&self, jwt_payload: &serde_json::Value) -> Result<TokenClaims, AuthError> {
        let subject = jwt_payload
            .get("sub")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AuthError::InvalidClaims("Missing sub claim".into()))?
            .to_string();

        let issuer = jwt_payload
            .get("iss")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AuthError::InvalidClaims("Missing iss claim".into()))?
            .to_string();

        let audience = jwt_payload.get("aud").and_then(|v| {
            if let Some(s) = v.as_str() {
                Some(vec![s.to_string()])
            } else {
                v.as_array().map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
            }
        });

        TokenClaims::new(
            subject,
            issuer,
            audience,
            jwt_payload.get("exp").and_then(|v| v.as_i64()),
            jwt_payload.get("iat").and_then(|v| v.as_i64()),
            jwt_payload.get("nbf").and_then(|v| v.as_i64()),
            jwt_payload
                .get("jti")
                .and_then(|v| v.as_str())
                .map(String::from),
            jwt_payload.clone(),
        )
    }
}
