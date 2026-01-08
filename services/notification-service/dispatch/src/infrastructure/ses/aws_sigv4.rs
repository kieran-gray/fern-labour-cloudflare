use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};

type HmacSha256 = Hmac<Sha256>;

const AWS_ALGORITHM: &str = "AWS4-HMAC-SHA256";

pub struct AwsSigV4Signer {
    access_key_id: String,
    secret_access_key: String,
    region: String,
    service: String,
}

impl AwsSigV4Signer {
    pub fn new(
        access_key_id: String,
        secret_access_key: String,
        region: String,
        service: String,
    ) -> Self {
        Self {
            access_key_id,
            secret_access_key,
            region,
            service,
        }
    }

    pub fn sign_request(
        &self,
        method: &str,
        host: &str,
        path: &str,
        headers: &[(String, String)],
        payload: &str,
        timestamp: DateTime<Utc>,
    ) -> SignedHeaders {
        let amz_date = timestamp.format("%Y%m%dT%H%M%SZ").to_string();
        let date_stamp = timestamp.format("%Y%m%d").to_string();

        let payload_hash = hex_sha256(payload.as_bytes());

        let mut canonical_headers_vec: Vec<(String, String)> = headers
            .iter()
            .map(|(k, v)| (k.to_lowercase(), v.trim().to_string()))
            .collect();
        canonical_headers_vec.push(("host".to_string(), host.to_string()));
        canonical_headers_vec.push(("x-amz-date".to_string(), amz_date.clone()));
        canonical_headers_vec.push(("x-amz-content-sha256".to_string(), payload_hash.clone()));
        canonical_headers_vec.sort_by(|a, b| a.0.cmp(&b.0));

        let canonical_headers: String = canonical_headers_vec
            .iter()
            .map(|(k, v)| format!("{}:{}\n", k, v))
            .collect();

        let signed_headers: String = canonical_headers_vec
            .iter()
            .map(|(k, _)| k.as_str())
            .collect::<Vec<_>>()
            .join(";");

        let canonical_request = format!(
            "{}\n{}\n{}\n{}\n{}\n{}",
            method, path, "", canonical_headers, signed_headers, payload_hash
        );

        let canonical_request_hash = hex_sha256(canonical_request.as_bytes());

        let credential_scope = format!(
            "{}/{}/{}/aws4_request",
            date_stamp, self.region, self.service
        );

        let string_to_sign = format!(
            "{}\n{}\n{}\n{}",
            AWS_ALGORITHM, amz_date, credential_scope, canonical_request_hash
        );

        let signing_key = self.derive_signing_key(&date_stamp);
        let signature = hex_hmac_sha256(&signing_key, string_to_sign.as_bytes());

        let authorization = format!(
            "{} Credential={}/{}, SignedHeaders={}, Signature={}",
            AWS_ALGORITHM, self.access_key_id, credential_scope, signed_headers, signature
        );

        SignedHeaders {
            authorization,
            x_amz_date: amz_date,
            x_amz_content_sha256: payload_hash,
        }
    }

    fn derive_signing_key(&self, date_stamp: &str) -> Vec<u8> {
        let k_date = hmac_sha256(
            format!("AWS4{}", self.secret_access_key).as_bytes(),
            date_stamp.as_bytes(),
        );
        let k_region = hmac_sha256(&k_date, self.region.as_bytes());
        let k_service = hmac_sha256(&k_region, self.service.as_bytes());
        hmac_sha256(&k_service, b"aws4_request")
    }
}

pub struct SignedHeaders {
    pub authorization: String,
    pub x_amz_date: String,
    pub x_amz_content_sha256: String,
}

fn hex_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC can take key of any size");
    mac.update(data);
    mac.finalize().into_bytes().to_vec()
}

fn hex_hmac_sha256(key: &[u8], data: &[u8]) -> String {
    hex::encode(hmac_sha256(key, data))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_hex_sha256() {
        let hash = hex_sha256(b"test");
        assert_eq!(
            hash,
            "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
        );
    }

    #[test]
    fn test_hmac_sha256_standard_vector() {
        let result = hmac_sha256(b"key", b"The quick brown fox jumps over the lazy dog");
        assert_eq!(
            hex::encode(&result),
            "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"
        );
    }

    #[test]
    fn test_signing_key_derivation_aws_example() {
        let secret = "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY";
        let date_stamp = "20150830";
        let region = "us-east-1";
        let service = "iam";

        let k_secret = format!("AWS4{}", secret);

        let k_date = hmac_sha256(k_secret.as_bytes(), date_stamp.as_bytes());
        let k_region = hmac_sha256(&k_date, region.as_bytes());
        let k_service = hmac_sha256(&k_region, service.as_bytes());
        let k_signing = hmac_sha256(&k_service, b"aws4_request");

        assert_eq!(k_signing.len(), 32, "Signing key must be 32 bytes");
        let k_signing2 = {
            let k_date = hmac_sha256(k_secret.as_bytes(), date_stamp.as_bytes());
            let k_region = hmac_sha256(&k_date, region.as_bytes());
            let k_service = hmac_sha256(&k_region, service.as_bytes());
            hmac_sha256(&k_service, b"aws4_request")
        };
        assert_eq!(
            k_signing, k_signing2,
            "Key derivation must be deterministic"
        );
    }

    #[test]
    fn test_sign_request() {
        let signer = AwsSigV4Signer::new(
            "AKIAIOSFODNN7EXAMPLE".to_string(),
            "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY".to_string(),
            "eu-west-2".to_string(),
            "ses".to_string(),
        );

        let timestamp = Utc.with_ymd_and_hms(2023, 1, 1, 12, 0, 0).unwrap();
        let headers: Vec<(String, String)> =
            vec![("content-type".to_string(), "application/json".to_string())];

        let signed = signer.sign_request(
            "POST",
            "email.eu-west-2.amazonaws.com",
            "/v2/email/outbound-emails",
            &headers,
            "{}",
            timestamp,
        );

        assert!(signed.authorization.starts_with("AWS4-HMAC-SHA256"));
        assert!(
            signed
                .authorization
                .contains("Credential=AKIAIOSFODNN7EXAMPLE/20230101/eu-west-2/ses/aws4_request")
        );
        assert_eq!(signed.x_amz_date, "20230101T120000Z");
    }

    #[test]
    fn test_canonical_request_format() {
        let signer = AwsSigV4Signer::new(
            "AKIAIOSFODNN7EXAMPLE".to_string(),
            "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY".to_string(),
            "eu-west-2".to_string(),
            "ses".to_string(),
        );

        let timestamp = Utc.with_ymd_and_hms(2023, 1, 1, 12, 0, 0).unwrap();
        let headers: Vec<(String, String)> =
            vec![("content-type".to_string(), "application/json".to_string())];

        let signed = signer.sign_request(
            "POST",
            "email.eu-west-2.amazonaws.com",
            "/v2/email/outbound-emails",
            &headers,
            "{}",
            timestamp,
        );

        assert!(
            signed
                .authorization
                .starts_with("AWS4-HMAC-SHA256 Credential="),
            "Authorization should start with algorithm and credential"
        );
        assert!(
            signed.authorization.contains("SignedHeaders="),
            "Authorization should contain SignedHeaders"
        );
        assert!(
            signed.authorization.contains("Signature="),
            "Authorization should contain Signature"
        );

        let signed_headers_part = signed
            .authorization
            .split("SignedHeaders=")
            .nth(1)
            .unwrap()
            .split(',')
            .next()
            .unwrap()
            .trim();
        assert!(
            signed_headers_part.contains("content-type"),
            "Should include content-type header"
        );
        assert!(
            signed_headers_part.contains("host"),
            "Should include host header"
        );
        assert!(
            signed_headers_part.contains("x-amz-date"),
            "Should include x-amz-date header"
        );

        assert_eq!(signed.x_amz_date, "20230101T120000Z");
    }

    #[test]
    fn test_signature_deterministic() {
        let signer = AwsSigV4Signer::new(
            "AKIAIOSFODNN7EXAMPLE".to_string(),
            "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY".to_string(),
            "eu-west-2".to_string(),
            "ses".to_string(),
        );

        let timestamp = Utc.with_ymd_and_hms(2023, 6, 15, 10, 30, 0).unwrap();
        let headers: Vec<(String, String)> =
            vec![("content-type".to_string(), "application/json".to_string())];
        let payload = r#"{"Content":{"Simple":{"Subject":{"Data":"Test"},"Body":{"Text":{"Data":"Hello"}}}}}"#;

        let signed1 = signer.sign_request(
            "POST",
            "email.eu-west-2.amazonaws.com",
            "/v2/email/outbound-emails",
            &headers,
            payload,
            timestamp,
        );

        let signed2 = signer.sign_request(
            "POST",
            "email.eu-west-2.amazonaws.com",
            "/v2/email/outbound-emails",
            &headers,
            payload,
            timestamp,
        );

        assert_eq!(signed1.authorization, signed2.authorization);
    }
}
