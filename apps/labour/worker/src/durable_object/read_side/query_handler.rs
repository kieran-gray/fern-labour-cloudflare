use fern_labour_event_sourcing_rs::{PaginatedResponse, SyncRepositoryTrait};
use fern_labour_labour_shared::{
    ApiQuery, ContractionQuery, LabourQuery, LabourUpdateQuery,
    queries::subscription::SubscriptionQuery,
};
use fern_labour_workers_shared::User;
use serde_json::Value;

use crate::durable_object::{
    authorization::{Action, Authorizer, QueryAction, resolve_principal},
    exceptions::AppError,
    http::utils::{build_paginated_response, decode_cursor},
    read_side::read_models::{
        subscription_token::SubscriptionTokenRepositoryTrait,
        subscriptions::sync_repository::SubscriptionRepositoryTrait,
    },
    setup::state::ReadModel,
};

pub struct QueryHandler<'a> {
    read_model: &'a ReadModel,
    authorizer: Authorizer,
}

impl<'a> QueryHandler<'a> {
    pub fn new(read_model: &'a ReadModel) -> Self {
        Self {
            read_model,
            authorizer: Authorizer::new(),
        }
    }

    pub fn handle(&self, query: ApiQuery, user: &User) -> Result<Value, AppError> {
        let aggregate = self.read_model.aggregate_repository.load()?;

        if let Some(ref labour) = aggregate
            && labour.is_deleted()
        {
            return Err(AppError::Gone("Labour has been deleted".into()));
        }

        let action = match &query {
            ApiQuery::Labour(_) => Action::Query(QueryAction::GetLabour),
            ApiQuery::Contraction(_) => Action::Query(QueryAction::GetContractions),
            ApiQuery::LabourUpdate(_) => Action::Query(QueryAction::GetLabourUpdates),
            ApiQuery::Subscription(sq) => match sq {
                SubscriptionQuery::GetSubscriptionToken { .. } => {
                    Action::Query(QueryAction::GetSubscriptionToken)
                }
                SubscriptionQuery::GetLabourSubscriptions { .. } => {
                    Action::Query(QueryAction::GetLabourSubscriptions)
                }
                SubscriptionQuery::GetUserSubscription { .. } => {
                    Action::Query(QueryAction::GetUserSubscription)
                }
            },
        };

        let principal = resolve_principal(user, aggregate.as_ref());
        self.authorizer
            .authorize(&principal, &action, aggregate.as_ref())?;

        match query {
            ApiQuery::Labour(q) => self.handle_labour(q),
            ApiQuery::Contraction(q) => self.handle_contraction(q),
            ApiQuery::LabourUpdate(q) => self.handle_labour_update(q),
            ApiQuery::Subscription(q) => self.handle_subscription(q, user),
        }
    }

    fn handle_labour(&self, query: LabourQuery) -> Result<Value, AppError> {
        match query {
            LabourQuery::GetLabour { .. } => {
                let labour = self
                    .read_model
                    .labour_repository
                    .get(1, None)?
                    .into_iter()
                    .next()
                    .ok_or_else(|| AppError::NotFound("Labour not found".into()))?;
                Ok(serde_json::to_value(labour)?)
            }
        }
    }

    fn handle_contraction(&self, query: ContractionQuery) -> Result<Value, AppError> {
        match query {
            ContractionQuery::GetContractions { limit, cursor, .. } => {
                let decoded =
                    decode_cursor(cursor).map_err(|e| AppError::Internal(e.to_string()))?;
                let items = self
                    .read_model
                    .contraction_repository
                    .get(limit + 1, decoded)?;
                Ok(serde_json::to_value(build_paginated_response(
                    items, limit,
                ))?)
            }
            ContractionQuery::GetContractionById { contraction_id, .. } => {
                let item = self
                    .read_model
                    .contraction_repository
                    .get_by_id(contraction_id)?;
                Ok(serde_json::to_value(item)?)
            }
        }
    }

    fn handle_labour_update(&self, query: LabourUpdateQuery) -> Result<Value, AppError> {
        match query {
            LabourUpdateQuery::GetLabourUpdates { limit, cursor, .. } => {
                let decoded_cursor =
                    decode_cursor(cursor).map_err(|e| AppError::Internal(e.to_string()))?;
                let response = self
                    .read_model
                    .labour_update_repository
                    .get(limit + 1, decoded_cursor)
                    .map(|items| build_paginated_response(items, limit))?;
                Ok(serde_json::to_value(response)?)
            }
            LabourUpdateQuery::GetLabourUpdateById {
                labour_update_id, ..
            } => {
                let response = self
                    .read_model
                    .labour_update_repository
                    .get_by_id(labour_update_id)
                    .map(|u| vec![u])
                    .map(|items| PaginatedResponse {
                        data: items,
                        next_cursor: None,
                        has_more: false,
                    })?;
                Ok(serde_json::to_value(response)?)
            }
        }
    }

    fn handle_subscription(
        &self,
        query: SubscriptionQuery,
        user: &User,
    ) -> Result<Value, AppError> {
        match query {
            SubscriptionQuery::GetSubscriptionToken { .. } => {
                let token = self
                    .read_model
                    .subscription_token_repository
                    .get_token()?
                    .ok_or_else(|| AppError::NotFound("No subscription token available".into()))?
                    .token;
                Ok(serde_json::json!({ "token": token }))
            }
            SubscriptionQuery::GetLabourSubscriptions { .. } => {
                let subscriptions = self
                    .read_model
                    .subscription_repository
                    .get(100, None) // TODO: when someone has 101 subs lol
                    .map(|items| build_paginated_response(items, 100))?;

                Ok(serde_json::to_value(subscriptions)?)
            }
            SubscriptionQuery::GetUserSubscription { .. } => {
                let subscription = self
                    .read_model
                    .subscription_repository
                    .get_by_subscriber_id(&user.user_id)?;

                Ok(serde_json::to_value(subscription)?)
            }
        }
    }
}
