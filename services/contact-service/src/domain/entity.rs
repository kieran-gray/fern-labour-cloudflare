use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::exceptions::ValidationError;

use super::enums::ContactMessageCategory;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ContactMessage {
    pub id: Uuid,
    pub category: ContactMessageCategory,
    pub email: String,
    pub name: String,
    pub message: String,
    pub data: Option<HashMap<String, String>>,
    pub received_at: DateTime<Utc>,
}

impl ContactMessage {
    pub fn create(
        category: ContactMessageCategory,
        email: String,
        name: String,
        message: String,
        data: Option<HashMap<String, String>>,
    ) -> Result<Self, ValidationError> {
        Self::validate_email(&email)?;
        Self::validate_name(&name)?;
        Self::validate_message(&message)?;
        Self::validate_data(&data)?;
        let received_at = Utc::now();

        Ok(Self {
            id: Uuid::now_v7(),
            category,
            email,
            name,
            message,
            data,
            received_at,
        })
    }

    fn validate_email(email: &str) -> Result<(), ValidationError> {
        if email.is_empty() || email.len() > 254 || email.chars().any(|c| c.is_whitespace()) {
            return Err(ValidationError::InvalidEmail(
                "Email must be between 1 and 254 characters".into(),
            ));
        }

        let mut parts = email.split('@');
        let local = parts.next().unwrap_or("");
        let domain = parts.next().unwrap_or("");

        if parts.next().is_some() || local.is_empty() || domain.is_empty() {
            return Err(ValidationError::InvalidEmail(
                "Invalid email format".to_string(),
            ));
        }

        match domain.find('.') {
            Some(i) if i > 0 && i < domain.len() - 1 => Ok(()),
            _ => Err(ValidationError::InvalidEmail(
                "Invalid email format".to_string(),
            )),
        }
    }

    fn validate_name(name: &str) -> Result<(), ValidationError> {
        let trimmed = name.trim();

        if trimmed.is_empty() {
            return Err(ValidationError::InvalidName("Name cannot be empty".into()));
        }

        if trimmed.len() > 100 {
            return Err(ValidationError::InvalidName(
                "Name must be 100 characters or less".into(),
            ));
        }

        Ok(())
    }

    fn validate_message(message: &str) -> Result<(), ValidationError> {
        let trimmed = message.trim();

        if trimmed.is_empty() {
            return Err(ValidationError::InvalidMessage(
                "Message cannot be empty".into(),
            ));
        }

        if trimmed.len() > 5000 {
            return Err(ValidationError::InvalidMessage(
                "Message must be 5000 characters or less".into(),
            ));
        }

        Ok(())
    }

    fn validate_data(data: &Option<HashMap<String, String>>) -> Result<(), ValidationError> {
        if let Some(map) = data {
            if map.len() > 20 {
                return Err(ValidationError::InvalidData(
                    "Data cannot contain more than 20 key-value pairs".into(),
                ));
            }

            for (key, value) in map.iter() {
                if key.len() > 200 {
                    return Err(ValidationError::InvalidData(
                        "Data keys must be 200 characters or less".into(),
                    ));
                }

                if value.len() > 1000 {
                    return Err(ValidationError::InvalidData(
                        "Data values must be 1000 characters or less".into(),
                    ));
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_valid_contact_message() {
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            "This is a valid message".to_string(),
            None,
        );

        assert!(result.is_ok());
        let contact = result.unwrap();
        assert_eq!(contact.email, "test@example.com");
        assert_eq!(contact.name, "John Doe");
        assert_eq!(contact.message, "This is a valid message");
        assert_eq!(contact.category, ContactMessageCategory::IDEA);
    }

    #[test]
    fn test_validate_email_empty() {
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "".to_string(),
            "John Doe".to_string(),
            "Valid message here".to_string(),
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidEmail(_)
        ));
    }

    #[test]
    fn test_validate_email_too_long() {
        let long_email = format!("{}@example.com", "a".repeat(250));
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            long_email,
            "John Doe".to_string(),
            "Valid message here".to_string(),
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidEmail(_)
        ));
    }

    #[test]
    fn test_validate_email_invalid_format() {
        let invalid_emails = vec![
            "notanemail",
            "missing@domain",
            "@nodomain.com",
            "no domain@.com",
            "spaces in@email.com",
        ];

        for email in invalid_emails {
            let result = ContactMessage::create(
                ContactMessageCategory::IDEA,
                email.to_string(),
                "John Doe".to_string(),
                "Valid message here".to_string(),
                None,
            );

            assert!(result.is_err(), "Email '{}' should be invalid", email);
            assert!(matches!(
                result.unwrap_err(),
                ValidationError::InvalidEmail(_)
            ));
        }
    }

    #[test]
    fn test_validate_email_valid_formats() {
        let valid_emails = vec![
            "test@example.com",
            "user.name@example.com",
            "user+tag@example.co.uk",
            "test123@test-domain.com",
        ];

        for email in valid_emails {
            let result = ContactMessage::create(
                ContactMessageCategory::IDEA,
                email.to_string(),
                "John Doe".to_string(),
                "Valid message here".to_string(),
                None,
            );

            assert!(result.is_ok(), "Email '{}' should be valid", email);
        }
    }

    #[test]
    fn test_validate_name_empty() {
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "".to_string(),
            "Valid message here".to_string(),
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidName(_)
        ));
    }

    #[test]
    fn test_validate_name_whitespace_only() {
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "   ".to_string(),
            "Valid message here".to_string(),
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidName(_)
        ));
    }

    #[test]
    fn test_validate_name_too_long() {
        let long_name = "a".repeat(101);
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            long_name,
            "Valid message here".to_string(),
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidName(_)
        ));
    }

    #[test]
    fn test_validate_message_empty() {
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            "".to_string(),
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidMessage(_)
        ));
    }

    #[test]
    fn test_validate_message_whitespace_only() {
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            "     ".to_string(),
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidMessage(_)
        ));
    }

    #[test]
    fn test_validate_message_too_long() {
        let long_message = "a".repeat(5001);
        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            long_message,
            None,
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidMessage(_)
        ));
    }

    #[test]
    fn test_validate_data_too_many_pairs() {
        let mut data = HashMap::new();
        for i in 0..21 {
            data.insert(format!("key{}", i), format!("value{}", i));
        }

        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            "Valid message here".to_string(),
            Some(data),
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidData(_)
        ));
    }

    #[test]
    fn test_validate_data_key_too_long() {
        let mut data = HashMap::new();
        data.insert("a".repeat(201), "value".to_string());

        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            "Valid message here".to_string(),
            Some(data),
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidData(_)
        ));
    }

    #[test]
    fn test_validate_data_value_too_long() {
        let mut data = HashMap::new();
        data.insert("key".to_string(), "a".repeat(1001));

        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            "Valid message here".to_string(),
            Some(data),
        );

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ValidationError::InvalidData(_)
        ));
    }

    #[test]
    fn test_validate_data_valid() {
        let mut data = HashMap::new();
        data.insert("rating".to_string(), "5".to_string());
        data.insert("source".to_string(), "website".to_string());

        let result = ContactMessage::create(
            ContactMessageCategory::IDEA,
            "test@example.com".to_string(),
            "John Doe".to_string(),
            "Valid message here".to_string(),
            Some(data.clone()),
        );

        assert!(result.is_ok());
        let contact = result.unwrap();
        assert_eq!(contact.data, Some(data));
    }
}
