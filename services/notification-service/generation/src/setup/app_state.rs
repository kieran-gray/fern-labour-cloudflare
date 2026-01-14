use anyhow::Result;
use worker::Env;

use crate::{
    application::template_engine::TemplateEngineTrait,
    infrastructure::template_engine::TinyTemplateEngine,
};

pub struct AppState {
    pub template_engine: Box<dyn TemplateEngineTrait>,
}

impl AppState {
    pub fn from_env(_env: &Env) -> Result<Self> {
        let template_engine = Box::new(TinyTemplateEngine::new());

        Ok(Self { template_engine })
    }
}
