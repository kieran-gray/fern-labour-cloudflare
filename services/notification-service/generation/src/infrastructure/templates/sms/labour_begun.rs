use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourBegunTemplate;

impl TemplateTrait for LabourBegunTemplate {
    fn template_string() -> &'static str {
        "Hey {subscriber_first_name},\n\
         Exciting news, {birthing_person_first_name} has started labour!\n\
         Remember that things can be slow at first, so please be patient and check FernLabour for any updates."
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_begun_contains_placeholders() {
        let template = LabourBegunTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{birthing_person_first_name}"));
    }

    #[test]
    fn test_labour_begun_contains_exciting_news() {
        let template = LabourBegunTemplate::template_string();
        assert!(template.contains("Exciting news"));
    }
}
