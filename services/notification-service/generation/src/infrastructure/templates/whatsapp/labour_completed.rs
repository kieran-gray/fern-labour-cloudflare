use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourCompletedTemplateSid;
pub struct LabourCompletedContentVariablesTemplate;

impl TemplateTrait for LabourCompletedTemplateSid {
    fn template_string() -> &'static str {
        "HXa4be7b7f652ad8efe00ef81223b85c6a"
    }
}

impl TemplateTrait for LabourCompletedContentVariablesTemplate {
    fn template_string() -> &'static str {
        "\\{\"1\":\"{subscriber_first_name}\",\"2\":\"{birthing_person_first_name}\",\"3\":\"{link}\"}"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_completed_contains_placeholders() {
        let template = LabourCompletedContentVariablesTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{birthing_person_first_name}"));
    }

    #[test]
    fn test_labour_completed_is_valid_json_structure() {
        let template = LabourCompletedContentVariablesTemplate::template_string();
        assert!(template.starts_with("\\{\"1\":"));
        assert!(template.contains("\"2\":"));
        assert!(template.contains("\"3\":"));
    }

    #[test]
    fn test_labour_completed_renders_to_valid_json() {
        use serde_json::Value;
        use tinytemplate::TinyTemplate;

        let mut tt = TinyTemplate::new();
        tt.add_template(
            "test",
            LabourCompletedContentVariablesTemplate::template_string(),
        )
        .unwrap();

        let mut context = std::collections::HashMap::new();
        context.insert("subscriber_first_name", "John");
        context.insert("birthing_person_first_name", "Sarah");
        context.insert("link", "https://example.com");

        let rendered = tt.render("test", &context).unwrap();

        let parsed: Value =
            serde_json::from_str(&rendered).expect("Rendered template should be valid JSON");

        assert_eq!(parsed["1"], "John");
        assert_eq!(parsed["2"], "Sarah");
        assert_eq!(parsed["3"], "https://example.com");
    }
}
