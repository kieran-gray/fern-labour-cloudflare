use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourCompletedWithNoteTemplateSid;
pub struct LabourCompletedWithNoteContentVariablesTemplate;

impl TemplateTrait for LabourCompletedWithNoteTemplateSid {
    fn template_string() -> &'static str {
        "HXa4be7b7f652ad8efe00ef81223b85c6a"
    }
}

impl TemplateTrait for LabourCompletedWithNoteContentVariablesTemplate {
    fn template_string() -> &'static str {
        "\\{\"1\":\"{subscriber_first_name}\",\"2\":\"{birthing_person_first_name}\",\"3\":\"{update}\"}"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_completed_with_note_contains_placeholders() {
        let template = LabourCompletedWithNoteContentVariablesTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{birthing_person_first_name}"));
        assert!(template.contains("{update}"));
    }

    #[test]
    fn test_labour_completed_with_note_is_valid_json_structure() {
        let template = LabourCompletedWithNoteContentVariablesTemplate::template_string();
        assert!(template.starts_with("\\{\"1\":"));
        assert!(template.contains("\"2\":"));
        assert!(template.contains("\"3\":"));
    }

    #[test]
    fn test_labour_completed_with_note_renders_to_valid_json() {
        use serde_json::Value;
        use tinytemplate::TinyTemplate;

        let mut tt = TinyTemplate::new();
        tt.add_template(
            "test",
            LabourCompletedWithNoteContentVariablesTemplate::template_string(),
        )
        .unwrap();

        let mut context = std::collections::HashMap::new();
        context.insert("subscriber_first_name", "John");
        context.insert("birthing_person_first_name", "Sarah");
        context.insert("update", "Everything went well");

        let rendered = tt.render("test", &context).unwrap();

        let parsed: Value =
            serde_json::from_str(&rendered).expect("Rendered template should be valid JSON");

        assert_eq!(parsed["1"], "John");
        assert_eq!(parsed["2"], "Sarah");
        assert_eq!(parsed["3"], "Everything went well");
    }
}
