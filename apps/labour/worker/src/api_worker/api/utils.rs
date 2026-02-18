use anyhow::Result;
use base64::{Engine, prelude::BASE64_URL_SAFE_NO_PAD};
use chrono::{DateTime, Utc};
use fern_labour_event_sourcing_rs::{Cursor, DecodedCursor, PaginatedQuery, PaginatedResponse};
use uuid::Uuid;
use worker::Request;

pub fn decode_paginated_query(req: &Request) -> Result<(usize, Option<DecodedCursor>)> {
    let url = req.url()?;
    let query: PaginatedQuery = serde_qs::from_str(url.query().unwrap_or(""))?;

    let limit = query.limit.unwrap_or(20).min(100);

    let decoded_cursor = query.cursor.and_then(|c_str| {
        let decoded = BASE64_URL_SAFE_NO_PAD.decode(c_str).ok()?;
        let s = String::from_utf8(decoded).ok()?;
        let mut parts = s.split('|');

        let timestamp = parts.next()?;
        let uuid = parts.next()?;

        if parts.next().is_some() {
            return None;
        }

        let last_updated_at = DateTime::parse_from_rfc3339(timestamp)
            .ok()
            .map(|dt| dt.with_timezone(&Utc))?;

        let last_id = Uuid::parse_str(uuid).ok()?;

        Some(DecodedCursor {
            last_updated_at,
            last_id,
        })
    });
    Ok((limit, decoded_cursor))
}

pub fn build_paginated_response<T: Cursor>(
    mut items: Vec<T>,
    limit: usize,
) -> PaginatedResponse<T> {
    let has_more = items.len() > limit;
    if has_more {
        items.pop();
    }

    let next_cursor = has_more.then(|| items.last()).flatten().map(|last_item| {
        let cursor_str = format!("{}|{}", last_item.updated_at().to_rfc3339(), last_item.id());
        BASE64_URL_SAFE_NO_PAD.encode(cursor_str)
    });

    PaginatedResponse {
        data: items,
        next_cursor,
        has_more,
    }
}
