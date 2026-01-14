use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourAnnouncementSubjectTemplate;
pub struct LabourAnnouncementBodyTemplate;

impl TemplateTrait for LabourAnnouncementSubjectTemplate {
    fn template_string() -> &'static str {
        r#"A new update from {birthing_person_name}"#
    }
}

impl TemplateTrait for LabourAnnouncementBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/labour_announcement.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_announcement_subject_contains_name_placeholder() {
        let template = LabourAnnouncementSubjectTemplate::template_string();
        assert!(template.contains("{birthing_person_name}"));
    }

    #[test]
    fn test_labour_announcement_body_contains_html() {
        let template = LabourAnnouncementBodyTemplate::template_string();
        assert!(template.contains("<!DOCTYPE html>"));
    }
}
