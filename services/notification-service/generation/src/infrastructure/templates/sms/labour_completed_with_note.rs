use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourCompletedWithNoteTemplate;

impl TemplateTrait for LabourCompletedWithNoteTemplate {
    fn template_string() -> &'static str {
        "Hey {subscriber_first_name},\n\
         Wonderful news, {birthing_person_first_name} has completed labour!\n\
         They added the following note:\n\
         {update}"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_completed_with_note_contains_placeholders() {
        let template = LabourCompletedWithNoteTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{birthing_person_first_name}"));
        assert!(template.contains("{update}"));
    }

    #[test]
    fn test_labour_completed_with_note_contains_wonderful_news() {
        let template = LabourCompletedWithNoteTemplate::template_string();
        assert!(template.contains("Wonderful news"));
    }
}
