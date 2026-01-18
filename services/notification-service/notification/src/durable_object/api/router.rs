use worker::{Method, Request, Response, Result};

use crate::durable_object::{
    api::{
        middleware::with_auth_context,
        routes::{
            admin::handle_admin_command, events::handle_events_query,
            internal::handle_internal_command, notification::handle_domain_command,
        },
    },
    state::AggregateServices,
};

pub struct RequestContext<'a> {
    pub data: &'a AggregateServices,
}

impl<'a> RequestContext<'a> {
    pub fn new(data: &'a AggregateServices) -> Self {
        Self { data }
    }
}

pub async fn route_request(req: Request, services: &AggregateServices) -> Result<Response> {
    let method = req.method();
    let path = req.path();
    let ctx = RequestContext::new(services);

    match (method, path.as_str()) {
        (Method::Post, "/notification/domain") => {
            with_auth_context(handle_domain_command, req, ctx).await
        }
        (Method::Post, "/notification/command") => {
            with_auth_context(handle_internal_command, req, ctx).await
        }
        (Method::Post, "/admin/command") => with_auth_context(handle_admin_command, req, ctx).await,
        (Method::Get, "/notification/events") => {
            with_auth_context(handle_events_query, req, ctx).await
        }
        _ => Response::error("Not Found", 404),
    }
}
