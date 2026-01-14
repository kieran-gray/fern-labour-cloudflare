use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourUpdateTemplate;

impl TemplateTrait for LabourUpdateTemplate {
    fn template_string() -> &'static str {
        "Hey {subscriber_first_name}, {update}"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_update_contains_placeholders() {
        let template = LabourUpdateTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{update}"));
    }
}
