use chrono::{DateTime, Utc};
use worker::wasm_bindgen::JsValue;

pub fn option_string_to_jsvalue(opt: Option<&String>) -> JsValue {
    match opt {
        Some(s) => s.clone().into(),
        None => JsValue::NULL,
    }
}

pub fn option_datetime_to_jsvalue(opt: Option<DateTime<Utc>>) -> JsValue {
    match opt {
        Some(dt) => dt.to_rfc3339().into(),
        None => JsValue::NULL,
    }
}
