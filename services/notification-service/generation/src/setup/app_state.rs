use anyhow::Result;
use worker::Env;

use crate::infrastructure::template_engine::TinyTemplateEngine;

pub struct AppState {
    pub template_engine: TinyTemplateEngine,
}

impl AppState {
    pub fn from_env(_env: &Env) -> Result<Self> {
        Ok(Self {
            template_engine: TinyTemplateEngine::new(),
        })
    }
}
