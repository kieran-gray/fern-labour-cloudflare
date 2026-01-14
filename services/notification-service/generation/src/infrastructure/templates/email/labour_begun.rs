use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourBegunSubjectTemplate;
pub struct LabourBegunBodyTemplate;

impl TemplateTrait for LabourBegunSubjectTemplate {
    fn template_string() -> &'static str {
        r#"{birthing_person_name} has started labour 💫"#
    }
}

impl TemplateTrait for LabourBegunBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/labour_begun.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_begun_subject_contains_name_placeholder() {
        let template = LabourBegunSubjectTemplate::template_string();
        assert!(template.contains("{birthing_person_name}"));
    }

    #[test]
    fn test_labour_begun_body_contains_html() {
        let template = LabourBegunBodyTemplate::template_string();
        assert!(template.contains("<!DOCTYPE html>"));
    }
}
