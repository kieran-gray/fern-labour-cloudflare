use worker::Response;

use crate::durable_object::exceptions::IntoWorkerResponse;

pub enum ApiResult {
    Success(Response),
    Failed(Response),
}

impl ApiResult {
    pub fn into_response(self) -> Response {
        match self {
            ApiResult::Success(r) | ApiResult::Failed(r) => r,
        }
    }

    pub fn is_success(&self) -> bool {
        matches!(self, ApiResult::Success(_))
    }

    pub fn from_unit_result(result: anyhow::Result<()>) -> Self {
        match result {
            Ok(()) => Self::Success(Response::empty().unwrap().with_status(204)),
            Err(err) => Self::Failed(err.into_response()),
        }
    }

    pub fn from_json_result<T: serde::Serialize>(result: anyhow::Result<T>) -> Self {
        match result {
            Ok(data) => Self::Success(Response::from_json(&data).unwrap()),
            Err(err) => Self::Failed(err.into_response()),
        }
    }
}
