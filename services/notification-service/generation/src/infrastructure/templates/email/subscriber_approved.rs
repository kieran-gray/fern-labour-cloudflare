use crate::infrastructure::templates::template::TemplateTrait;

pub struct SubscriberApprovedSubjectTemplate;
pub struct SubscriberApprovedBodyTemplate;

impl TemplateTrait for SubscriberApprovedSubjectTemplate {
    fn template_string() -> &'static str {
        r#"{birthing_person_name} has approved your request 💛"#
    }
}

impl TemplateTrait for SubscriberApprovedBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/subscriber_approved.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_subscriber_approved_subject_contains_name_placeholder() {
        let template = SubscriberApprovedSubjectTemplate::template_string();
        assert!(template.contains("{birthing_person_name}"));
    }

    #[test]
    fn test_subscriber_approved_body_contains_html() {
        let template = SubscriberApprovedBodyTemplate::template_string();
        assert!(template.contains("<!DOCTYPE html>"));
    }
}
