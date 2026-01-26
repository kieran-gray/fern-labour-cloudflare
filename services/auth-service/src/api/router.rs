use worker::*;

use crate::api::routes::auth::{authenticate_handler, verify_token_handler};
use crate::api::utils::handlers::create_options_handler;
use crate::setup::app_state::AppState;

pub fn create_router(app_state: AppState) -> Router<'static, AppState> {
    Router::with_data(app_state)
        .post_async("/api/v1/auth/verify/", verify_token_handler)
        .options("/api/v1/auth/verify/", create_options_handler)
        .post_async("/api/v1/auth/authenticate/", authenticate_handler)
        .options("/api/v1/auth/authenticate/", create_options_handler)
}
