use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourAnnouncementTemplate;

impl TemplateTrait for LabourAnnouncementTemplate {
    fn template_string() -> &'static str {
        "Hey {subscriber_first_name},\n\
         {birthing_person_first_name} has shared a new message with you through FernLabour:\n\
         {announcement}"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_announcement_contains_placeholders() {
        let template = LabourAnnouncementTemplate::template_string();
        assert!(template.contains("{subscriber_first_name}"));
        assert!(template.contains("{birthing_person_first_name}"));
        assert!(template.contains("{announcement}"));
    }
}
