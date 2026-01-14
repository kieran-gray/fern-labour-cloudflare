use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourAnnouncementTemplateSid;
pub struct LabourAnnouncementContentVariablesTemplate;

impl TemplateTrait for LabourAnnouncementTemplateSid {
    fn template_string() -> &'static str {
        "HX41e6683ac06893d80af526ed09c2171a"
    }
}

impl TemplateTrait for LabourAnnouncementContentVariablesTemplate {
    fn template_string() -> &'static str {
        "\\{\"1\":\"{subscriber_first_name}\",\"2\":\"{birthing_person_first_name}\",\"3\":\"{announcement}\"}"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_announcement_contains_placeholders() {
        let template = LabourAnnouncementContentVariablesTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{birthing_person_first_name}"));
        assert!(template.contains("{announcement}"));
    }

    #[test]
    fn test_labour_announcement_is_valid_json_structure() {
        let template = LabourAnnouncementContentVariablesTemplate::template_string();
        assert!(template.starts_with("\\{\"1\":"));
        assert!(template.contains("\"2\":"));
        assert!(template.contains("\"3\":"));
    }

    #[test]
    fn test_labour_announcement_renders_to_valid_json() {
        use serde_json::Value;
        use tinytemplate::TinyTemplate;

        let mut tt = TinyTemplate::new();
        tt.add_template(
            "test",
            LabourAnnouncementContentVariablesTemplate::template_string(),
        )
        .unwrap();

        let mut context = std::collections::HashMap::new();
        context.insert("subscriber_first_name", "John");
        context.insert("birthing_person_first_name", "Sarah");
        context.insert("announcement", "Hello world");

        let rendered = tt.render("test", &context).unwrap();

        let parsed: Value =
            serde_json::from_str(&rendered).expect("Rendered template should be valid JSON");

        assert_eq!(parsed["1"], "John");
        assert_eq!(parsed["2"], "Sarah");
        assert_eq!(parsed["3"], "Hello world");
    }
}
