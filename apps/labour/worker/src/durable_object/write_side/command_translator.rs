use anyhow::{Result, anyhow};
use fern_labour_labour_shared::ApiCommand;
use fern_labour_workers_shared::User;

use crate::durable_object::write_side::domain::LabourCommand;

pub struct CommandTranslator;

impl CommandTranslator {
    pub fn translate(command: ApiCommand, user: &User) -> Result<LabourCommand> {
        match command {
            ApiCommand::Admin(_) => Err(anyhow!("Admin commands must use the admin endpoint")),
            ApiCommand::Labour(cmd) => Ok(LabourCommand::from(cmd)),
            ApiCommand::LabourUpdate(cmd) => Ok(LabourCommand::from(cmd)),
            ApiCommand::Contraction(cmd) => Ok(LabourCommand::from(cmd)),
            ApiCommand::Subscriber(cmd) => Ok(LabourCommand::from((cmd, user.user_id.clone()))),
            ApiCommand::Subscription(cmd) => Ok(LabourCommand::from(cmd)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use fern_labour_labour_shared::ContractionCommand;
    use uuid::Uuid;

    fn test_user() -> User {
        User {
            user_id: "test-user".to_string(),
            issuer: "test".to_string(),
            name: Some("Test User".to_string()),
            email: Some("test@example.com".to_string()),
            phone_number: None,
            first_name: Some("Test".to_string()),
            last_name: Some("User".to_string()),
        }
    }

    #[test]
    fn translates_contraction_command() {
        let api_cmd = ApiCommand::Contraction(ContractionCommand::StartContraction {
            labour_id: Uuid::now_v7(),
            contraction_id: Uuid::now_v7(),
            start_time: Some(Utc::now()),
        });

        let result = CommandTranslator::translate(api_cmd, &test_user());
        assert!(result.is_ok());
        assert!(matches!(
            result.unwrap(),
            LabourCommand::StartContraction(..)
        ));
    }

    #[test]
    fn rejects_admin_command() {
        let api_cmd =
            ApiCommand::Admin(fern_labour_labour_shared::AdminCommand::RebuildReadModels {
                aggregate_id: Uuid::now_v7(),
            });

        let result = CommandTranslator::translate(api_cmd, &test_user());
        assert!(result.is_err());
    }
}
