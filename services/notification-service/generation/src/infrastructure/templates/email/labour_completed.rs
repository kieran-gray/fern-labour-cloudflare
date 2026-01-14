use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourCompletedSubjectTemplate;
pub struct LabourCompletedBodyTemplate;

impl TemplateTrait for LabourCompletedSubjectTemplate {
    fn template_string() -> &'static str {
        r#"Welcome, baby! 🎉"#
    }
}

impl TemplateTrait for LabourCompletedBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/labour_completed.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_completed_subject_contains_welcome() {
        let template = LabourCompletedSubjectTemplate::template_string();
        assert!(template.contains("Welcome"));
    }

    #[test]
    fn test_labour_completed_body_contains_html() {
        let template = LabourCompletedBodyTemplate::template_string();
        assert!(template.contains("<!DOCTYPE html>"));
    }
}
