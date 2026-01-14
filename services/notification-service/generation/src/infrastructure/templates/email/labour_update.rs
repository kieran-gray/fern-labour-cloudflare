use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourUpdateSubjectTemplate;
pub struct LabourUpdateBodyTemplate;

impl TemplateTrait for LabourUpdateSubjectTemplate {
    fn template_string() -> &'static str {
        r#"Labour update from {birthing_person_name}"#
    }
}

impl TemplateTrait for LabourUpdateBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/labour_update.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_update_subject_contains_name_placeholder() {
        let template = LabourUpdateSubjectTemplate::template_string();
        assert!(template.contains("{birthing_person_name}"));
    }

    #[test]
    fn test_labour_update_body_contains_html() {
        let template = LabourUpdateBodyTemplate::template_string();
        assert!(template.contains("<!DOCTYPE html>"));
    }
}
