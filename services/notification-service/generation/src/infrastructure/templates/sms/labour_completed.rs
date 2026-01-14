use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourCompletedTemplate;

impl TemplateTrait for LabourCompletedTemplate {
    fn template_string() -> &'static str {
        "Hey {subscriber_first_name},\n\
         Wonderful news, {birthing_person_first_name} has completed labour!"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_completed_contains_placeholders() {
        let template = LabourCompletedTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{birthing_person_first_name}"));
    }

    #[test]
    fn test_labour_completed_contains_wonderful_news() {
        let template = LabourCompletedTemplate::template_string();
        assert!(template.contains("Wonderful news"));
    }
}
