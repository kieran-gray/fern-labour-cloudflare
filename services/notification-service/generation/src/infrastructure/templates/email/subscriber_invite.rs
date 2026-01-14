use crate::infrastructure::templates::template::TemplateTrait;

pub struct SubscriberInviteSubjectTemplate;
pub struct SubscriberInviteBodyTemplate;

impl TemplateTrait for SubscriberInviteSubjectTemplate {
    fn template_string() -> &'static str {
        r#"A Brilliant Way to Share Your Baby Journey! 🍼"#
    }
}

impl TemplateTrait for SubscriberInviteBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/subscriber_invite.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_subscriber_invite_subject_contains_baby_journey() {
        let template = SubscriberInviteSubjectTemplate::template_string();
        assert!(template.contains("Baby Journey"));
    }

    #[test]
    fn test_subscriber_invite_body_contains_html() {
        let template = SubscriberInviteBodyTemplate::template_string();
        assert!(template.contains("<!doctype html>"));
    }
}
