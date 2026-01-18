use crate::{
    application::signature_verifier::SignatureVerifierTrait,
    domain::{AuthError, Jwk},
};

#[derive(Default)]
pub struct RS256SignatureVerifier;

impl SignatureVerifierTrait for RS256SignatureVerifier {
    fn verify_signature(&self, token: &str, jwk: &Jwk) -> Result<serde_json::Value, AuthError> {
        use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
        use jwt_compact::{UntrustedToken, alg::Rsa, prelude::*};
        use num_bigint_dig::BigUint;

        let n_bytes = URL_SAFE_NO_PAD
            .decode(&jwk.n)
            .map_err(|e| AuthError::VerificationFailed(format!("Invalid n: {}", e)))?;
        let e_bytes = URL_SAFE_NO_PAD
            .decode(&jwk.e)
            .map_err(|e| AuthError::VerificationFailed(format!("Invalid e: {}", e)))?;

        let n = BigUint::from_bytes_be(&n_bytes);
        let e = BigUint::from_bytes_be(&e_bytes);

        let public_key = jwt_compact::alg::RsaPublicKey::new(n, e)
            .map_err(|e| AuthError::VerificationFailed(format!("{}", e)))?;

        let untrusted = UntrustedToken::new(token)
            .map_err(|e| AuthError::VerificationFailed(format!("{}", e)))?;

        let token_data: Token<serde_json::Value> = Rsa::rs256()
            .validator::<serde_json::Value>(&public_key)
            .validate(&untrusted)
            .map_err(|_| AuthError::VerificationFailed("Token failed RS256 validation".into()))?;

        Ok(token_data.claims().custom.clone())
    }
}
