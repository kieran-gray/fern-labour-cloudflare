use anyhow::{Result, anyhow};
use fern_labour_notifications_shared::value_objects::NotificationStatus;
use serde::Serialize;
use std::collections::HashMap;

use crate::application::webhook::ProviderStatusTranslator;

#[derive(Serialize, Debug)]
pub struct WebhookInterpretation {
    pub external_id: String,
    pub status: NotificationStatus,
}

pub struct WebhookInterpreterService {
    translators: HashMap<String, Box<dyn ProviderStatusTranslator>>,
}

impl WebhookInterpreterService {
    pub fn create(translators: Vec<Box<dyn ProviderStatusTranslator>>) -> Self {
        let mut translator_map = HashMap::new();

        for translator in translators {
            translator_map.insert(translator.provider_name().to_string(), translator);
        }

        Self {
            translators: translator_map,
        }
    }

    pub async fn interpret(
        &self,
        provider: &str,
        external_id: &str,
        provider_event: &str,
    ) -> Result<WebhookInterpretation> {
        let translator = self.translators.get(provider).ok_or_else(|| {
            anyhow!(
                "No status translator found for provider: {}. Available translators: {:?}",
                provider,
                self.translators.keys().collect::<Vec<_>>()
            )
        })?;

        let status = translator.translate(provider_event)?;

        Ok(WebhookInterpretation {
            external_id: external_id.to_string(),
            status,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockTranslator {
        provider: String,
    }

    impl ProviderStatusTranslator for MockTranslator {
        fn provider_name(&self) -> &str {
            &self.provider
        }

        fn translate(&self, event: &str) -> Result<NotificationStatus> {
            match event {
                "sent" => Ok(NotificationStatus::SENT),
                "delivered" => Ok(NotificationStatus::DELIVERED),
                "failed" => Ok(NotificationStatus::FAILED),
                _ => Err(anyhow!("Unknown event")),
            }
        }
    }

    #[tokio::test]
    async fn test_interpret_success() {
        let translator = Box::new(MockTranslator {
            provider: "test-provider".to_string(),
        });

        let service = WebhookInterpreterService::create(vec![translator]);

        let result = service
            .interpret("test-provider", "abc123", "delivered")
            .await
            .unwrap();

        assert_eq!(result.status, NotificationStatus::DELIVERED);
    }

    #[tokio::test]
    async fn test_interpret_unknown_provider() {
        let translator = Box::new(MockTranslator {
            provider: "test-provider".to_string(),
        });

        let service = WebhookInterpreterService::create(vec![translator]);

        let result = service
            .interpret("unknown-provider", "abc123", "delivered")
            .await;

        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("No status translator found")
        );
    }
}
