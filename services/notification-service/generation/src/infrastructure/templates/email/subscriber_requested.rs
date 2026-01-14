use crate::infrastructure::templates::template::TemplateTrait;

pub struct SubscriberRequestedSubjectTemplate;
pub struct SubscriberRequestedBodyTemplate;

impl TemplateTrait for SubscriberRequestedSubjectTemplate {
    fn template_string() -> &'static str {
        r#"{subscriber_name} wants to join your labour circle 🌼"#
    }
}

impl TemplateTrait for SubscriberRequestedBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/subscriber_requested.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_subscriber_requested_subject_contains_name_placeholder() {
        let template = SubscriberRequestedSubjectTemplate::template_string();
        assert!(template.contains("{subscriber_name}"));
    }

    #[test]
    fn test_subscriber_requested_body_contains_html() {
        let template = SubscriberRequestedBodyTemplate::template_string();
        assert!(template.contains("<!doctype html>"));
    }
}
