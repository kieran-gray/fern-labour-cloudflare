use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum RenderedContent {
    Email {
        subject: String,
        html_body: String,
    },
    Sms {
        body: String,
    },
    WhatsApp {
        template_sid: String,
        content_variables: String,
    },
}

impl RenderedContent {
    pub fn channel(&self) -> &str {
        match self {
            RenderedContent::Email { .. } => "EMAIL",
            RenderedContent::Sms { .. } => "SMS",
            RenderedContent::WhatsApp { .. } => "WHATSAPP",
        }
    }

    pub fn has_subject(&self) -> bool {
        matches!(
            self,
            RenderedContent::Email { .. } | RenderedContent::WhatsApp { .. }
        )
    }

    pub fn body(&self) -> &str {
        match self {
            RenderedContent::Email { html_body, .. } => html_body,
            RenderedContent::Sms { body } => body,
            RenderedContent::WhatsApp {
                content_variables, ..
            } => content_variables,
        }
    }

    pub fn subject(&self) -> Option<&str> {
        match self {
            RenderedContent::Email { subject, .. } => Some(subject),
            RenderedContent::WhatsApp { template_sid, .. } => Some(template_sid),
            _ => None,
        }
    }
}
