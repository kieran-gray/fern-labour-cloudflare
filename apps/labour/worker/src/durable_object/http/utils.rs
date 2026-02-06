use base64::{Engine, prelude::BASE64_URL_SAFE_NO_PAD};
use chrono::{DateTime, Utc};
use fern_labour_event_sourcing_rs::{Cursor as CursorTrait, DecodedCursor, PaginatedResponse};
use fern_labour_labour_shared::Cursor;

pub fn build_paginated_response<T: CursorTrait>(
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

pub fn decode_cursor(cursor: Option<Cursor>) -> Result<Option<DecodedCursor>, String> {
    match cursor {
        Some(c) => {
            let last_updated_at = DateTime::parse_from_rfc3339(&c.updated_at)
                .map(|dt| dt.with_timezone(&Utc))
                .map_err(|e| format!("Failed to parse cursor date: {}", e))?;

            Ok(Some(DecodedCursor {
                last_id: c.id,
                last_updated_at,
            }))
        }
        None => Ok(None),
    }
}
