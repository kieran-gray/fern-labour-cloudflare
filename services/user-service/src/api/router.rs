use worker::Router;

use crate::{
    api::routes::{get_user, get_users},
    setup::app_state::AppState,
};

pub fn create_router(app_state: AppState) -> Router<'static, AppState> {
    Router::with_data(app_state)
        .post_async("/api/v1/users", get_users)
        .get_async("/api/v1/user/:user", get_user)
}
