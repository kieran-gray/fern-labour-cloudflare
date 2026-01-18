use async_trait::async_trait;
use std::sync::Arc;
use tracing::{debug, error, info, warn};
use worker::{Fetch, Method, Request, RequestInit};

use fern_labour_workers_shared::cache::CacheTrait;

use crate::domain::{AuthError, JWKS, Jwk, JwksRepositoryTrait};

pub struct JwksRepository<C: CacheTrait + Send + Sync> {
    cache: Arc<C>,
}

impl<C: CacheTrait + Send + Sync> JwksRepository<C> {
    pub fn create(cache: C) -> Self {
        Self {
            cache: Arc::new(cache),
        }
    }

    pub async fn fetch_jwks(&self, issuer_url: &str) -> Result<JWKS, AuthError> {
        let mut init = RequestInit::new();
        init.with_method(Method::Get);

        let request = Request::new_with_init(issuer_url, &init).map_err(|e| {
            AuthError::JwksFetchFailed(format!("Failed to create JWKS request: {e}"))
        })?;

        let mut response = Fetch::Request(request).send().await.map_err(|e| {
            error!(
                error = ?e,
                issuer_url = ?issuer_url,
                "JWKS request failed"
            );
            AuthError::JwksFetchFailed(format!("JWKS request failed: {e}"))
        })?;

        let jwks_response: JWKS = response.json().await.map_err(|e| {
            error!(error = ?e, "Failed to parse JWKS response");
            AuthError::JwksFetchFailed(format!("Failed to parse JWKS response: {e}"))
        })?;

        let _ = self
            .cache
            .set(issuer_url.into(), jwks_response.clone())
            .await;

        Ok(jwks_response)
    }
}

#[async_trait(?Send)]
impl<C: CacheTrait + Send + Sync> JwksRepositoryTrait for JwksRepository<C> {
    async fn get_jwk_by_key_id(&self, key_id: &str, issuer_url: &str) -> Result<Jwk, AuthError> {
        let jwks = match self.cache.get::<JWKS>(issuer_url.into()).await {
            Ok(Some(jwks)) => {
                info!(cache_status = "hit", "Retrieved JWKS from cache");
                jwks
            }
            Ok(None) => {
                debug!(
                    cache_status = "miss",
                    "Cache miss, fetching from auth provider"
                );
                self.fetch_jwks(issuer_url).await?
            }
            Err(err) => {
                warn!(error = %err, cache_status = "failed", "Cache retrieval failed");
                self.fetch_jwks(issuer_url).await?
            }
        };
        let jwk = jwks.get(key_id).ok_or(AuthError::JwksFetchFailed(format!(
            "Key not found: {}",
            key_id
        )))?;

        Ok(jwk.clone())
    }
}
