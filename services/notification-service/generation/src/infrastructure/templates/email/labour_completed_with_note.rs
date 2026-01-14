use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourCompletedWithNoteSubjectTemplate;
pub struct LabourCompletedWithNoteBodyTemplate;

impl TemplateTrait for LabourCompletedWithNoteSubjectTemplate {
    fn template_string() -> &'static str {
        r#"Welcome, baby! 🎉"#
    }
}

impl TemplateTrait for LabourCompletedWithNoteBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/labour_completed_with_note.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_completed_with_note_subject_contains_welcome() {
        let template = LabourCompletedWithNoteSubjectTemplate::template_string();
        assert!(template.contains("Welcome"));
    }

    #[test]
    fn test_labour_completed_with_note_body_contains_html() {
        let template = LabourCompletedWithNoteBodyTemplate::template_string();
        assert!(template.contains("<!DOCTYPE html>"));
    }
}
