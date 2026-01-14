use crate::infrastructure::templates::template::TemplateTrait;

pub struct LabourInviteSubjectTemplate;
pub struct LabourInviteBodyTemplate;

impl TemplateTrait for LabourInviteSubjectTemplate {
    fn template_string() -> &'static str {
        r#"Special invitation: Follow our baby's arrival journey 👶"#
    }
}

impl TemplateTrait for LabourInviteBodyTemplate {
    fn template_string() -> &'static str {
        include_str!("./build/labour_invite.html")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_labour_invite_subject_contains_invitation_text() {
        let template = LabourInviteSubjectTemplate::template_string();
        assert!(template.contains("invitation"));
    }

    #[test]
    fn test_labour_invite_body_contains_html() {
        let template = LabourInviteBodyTemplate::template_string();
        assert!(template.contains("<!DOCTYPE html>"));
    }
}
