use serde::{Deserialize, Serialize};

use crate::domain::AuthenticatedPrincipal;

#[derive(PartialEq, Debug, Deserialize, Serialize)]
pub struct UserDto {
    pub user_id: String,
    pub email: Option<String>,
    pub email_verified: Option<bool>,
    pub phone_number: Option<String>,
    pub phone_number_verified: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub name: Option<String>,
}

impl From<AuthenticatedPrincipal> for UserDto {
    fn from(value: AuthenticatedPrincipal) -> Self {
        Self {
            user_id: value.identity_id,
            email: value.email,
            email_verified: value.email_verified,
            phone_number: value.phone_number,
            phone_number_verified: value.phone_number_verified,
            first_name: value.first_name,
            last_name: value.last_name,
            name: value.name,
        }
    }
}
