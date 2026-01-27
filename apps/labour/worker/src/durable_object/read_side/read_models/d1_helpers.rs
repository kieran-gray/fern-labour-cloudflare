use fern_labour_event_sourcing_rs::DecodedCursor;
use worker::wasm_bindgen::JsValue;

pub use fern_labour_workers_shared::{option_datetime_to_jsvalue, option_string_to_jsvalue};

pub struct PaginatedQueryBuilder {
    query: String,
    bindings: Vec<JsValue>,
    id_column: &'static str,
}

impl PaginatedQueryBuilder {
    pub fn new(base_query: &str) -> Self {
        Self::with_id_column(base_query, "labour_id")
    }

    pub fn with_id_column(base_query: &str, id_column: &'static str) -> Self {
        Self {
            query: base_query.to_string(),
            bindings: vec![],
            id_column,
        }
    }

    pub fn with_binding(mut self, binding: JsValue) -> Self {
        self.bindings.push(binding);
        self
    }

    pub fn apply_cursor(mut self, cursor: Option<DecodedCursor>) -> Self {
        if let Some(cur) = cursor {
            let updated_at_param = self.bindings.len() + 1;
            let id_param = self.bindings.len() + 2;
            self.query.push_str(&format!(
                " AND (updated_at < ?{} OR (updated_at = ?{} AND {} < ?{}))",
                updated_at_param, updated_at_param, self.id_column, id_param
            ));
            self.bindings.push(cur.last_updated_at.to_rfc3339().into());
            self.bindings.push(cur.last_id.to_string().into());
        }
        self
    }

    pub fn apply_limit(mut self, limit: usize) -> Self {
        let limit_param = self.bindings.len() + 1;
        self.query.push_str(&format!(
            " ORDER BY updated_at DESC, {} DESC LIMIT ?{}",
            self.id_column, limit_param
        ));
        self.bindings.push(((limit + 1) as f64).into());
        self
    }

    pub fn build(self) -> (String, Vec<JsValue>) {
        (self.query, self.bindings)
    }
}
