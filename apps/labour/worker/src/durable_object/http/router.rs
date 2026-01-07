use worker::{Method, Request, Response, Result};

use crate::durable_object::{
    http::{
        middleware::with_auth_context,
        routes::{
            admin::handle_admin_command,
            command::handle_command,
            events::handle_events_query,
            labour::handle_labour_domain_command,
            query::{get_server_timestamp, handle_query},
        },
    },
    setup::state::LabourRoomServices,
};

pub struct RequestContext<'a> {
    pub data: &'a LabourRoomServices,
}

impl<'a> RequestContext<'a> {
    pub fn new(data: &'a LabourRoomServices) -> Self {
        Self { data }
    }
}

pub async fn route_request(req: Request, services: &LabourRoomServices) -> Result<Response> {
    let method = req.method();
    let path = req.path();
    let ctx = RequestContext::new(services);

    match (method, path.as_str()) {
        (Method::Post, "/api/command") => with_auth_context(handle_command, req, ctx).await,
        (Method::Post, "/api/query") => with_auth_context(handle_query, req, ctx).await,
        (Method::Post, "/admin/command") => with_auth_context(handle_admin_command, req, ctx).await,
        (Method::Get, "/labour/events") => with_auth_context(handle_events_query, req, ctx).await,
        (Method::Post, "/labour/domain") => {
            with_auth_context(handle_labour_domain_command, req, ctx).await
        }
        (Method::Get, "/api/timestamp") => with_auth_context(get_server_timestamp, req, ctx).await,

        _ => Response::error("Not Found", 404),
    }
}
