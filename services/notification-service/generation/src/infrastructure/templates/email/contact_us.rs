use crate::infrastructure::templates::template::TemplateTrait;

pub struct ContactUsSubjectTemplate;
pub struct ContactUsBodyTemplate;

impl TemplateTrait for ContactUsSubjectTemplate {
    fn template_string() -> &'static str {
        r#"Contact us submission from: {email}"#
    }
}

impl TemplateTrait for ContactUsBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/contact_us.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_contact_us_subject_contains_email_placeholder() {
        let template = ContactUsSubjectTemplate::template_string();
        assert!(template.contains("{email}"));
    }

    #[test]
    fn test_contact_us_body_contains_html() {
        let template = ContactUsBodyTemplate::template_string();
        assert!(template.contains("<!doctype html>"));
        assert!(template.contains("We've Received Your Message"));
    }
}
