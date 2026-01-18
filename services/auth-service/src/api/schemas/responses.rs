use crate::application::dtos::user::UserDto;
use serde::{Deserialize, Serialize};

#[derive(PartialEq, Debug, Deserialize, Serialize)]
pub struct VerifyTokenResponse {
    pub user_id: String,
}

#[derive(PartialEq, Debug, Deserialize, Serialize)]
pub struct AuthenticateResponse {
    pub user: UserDto,
}
