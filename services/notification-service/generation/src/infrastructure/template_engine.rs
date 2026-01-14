use fern_labour_notifications_shared::value_objects::{
    NotificationChannel, NotificationTemplateData, RenderedContent,
};
use tinytemplate::TinyTemplate;

use crate::{
    application::{exceptions::AppError, template_engine::TemplateEngineTrait},
    infrastructure::templates::{self, template::TemplateTrait},
};

#[derive(Default)]
pub struct TinyTemplateEngine {}

impl TinyTemplateEngine {
    pub fn new() -> Self {
        Self {}
    }

    fn render_subject<T: TemplateTrait>(
        &self,
        template_name: &str,
        data: &NotificationTemplateData,
    ) -> Result<String, AppError> {
        let mut tt = TinyTemplate::new();

        let template_text = T::template_string();

        tt.add_template(template_name, template_text)
            .map_err(|e| AppError::InternalError(e.to_string()))?;

        let rendered = tt
            .render(template_name, data)
            .map_err(|e| AppError::InternalError(e.to_string()))?;

        Ok(rendered)
    }

    fn render_body<T: TemplateTrait>(
        &self,
        template_name: &str,
        data: &NotificationTemplateData,
    ) -> Result<String, AppError> {
        let mut tt = TinyTemplate::new();

        let template_text = T::template_string();

        tt.add_template(template_name, template_text)
            .map_err(|e| AppError::InternalError(e.to_string()))?;

        let rendered = tt
            .render(template_name, data)
            .map_err(|e| AppError::InternalError(e.to_string()))?;

        Ok(rendered)
    }
}

impl TemplateEngineTrait for TinyTemplateEngine {
    fn render_content(
        &self,
        channel: NotificationChannel,
        data: NotificationTemplateData,
    ) -> Result<RenderedContent, AppError> {
        match data {
            data @ NotificationTemplateData::ContactUs { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::ContactUsSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self
                        .render_body::<templates::ContactUsBodyTemplate>(data.template(), &data)?,
                }),
                NotificationChannel::SMS => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
                NotificationChannel::WHATSAPP => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
            },
            data @ NotificationTemplateData::LabourAnnouncementData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::LabourAnnouncementSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::LabourAnnouncementBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Ok(RenderedContent::Sms {
                    body: self.render_body::<templates::sms::labour_announcement::LabourAnnouncementTemplate>(data.template(), &data)?,
                }),
                NotificationChannel::WHATSAPP => Ok(RenderedContent::WhatsApp {
                    template_sid: self.render_subject::<templates::whatsapp::labour_announcement::LabourAnnouncementTemplateSid>(data.template(), &data)?,
                    content_variables: self.render_body::<templates::whatsapp::labour_announcement::LabourAnnouncementContentVariablesTemplate>(data.template(), &data)?,
                }),
            },
            data @ NotificationTemplateData::LabourBegunData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::LabourBegunSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::LabourBegunBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Ok(RenderedContent::Sms {
                    body: self.render_body::<templates::sms::labour_begun::LabourBegunTemplate>(data.template(), &data)?,
                }),
                NotificationChannel::WHATSAPP => Ok(RenderedContent::WhatsApp {
                    template_sid: self.render_subject::<templates::whatsapp::labour_begun::LabourBegunTemplateSid>(data.template(), &data)?,
                    content_variables: self.render_body::<templates::whatsapp::labour_begun::LabourBegunContentVariablesTemplate>(data.template(), &data)?,
                }),
            },
            data @ NotificationTemplateData::LabourCompletedData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::LabourCompletedSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::LabourCompletedBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Ok(RenderedContent::Sms {
                    body: self.render_body::<templates::sms::labour_completed::LabourCompletedTemplate>(data.template(), &data)?,
                }),
                NotificationChannel::WHATSAPP => Ok(RenderedContent::WhatsApp {
                    template_sid: self.render_subject::<templates::whatsapp::labour_completed::LabourCompletedTemplateSid>(data.template(), &data)?,
                    content_variables: self.render_body::<templates::whatsapp::labour_completed::LabourCompletedContentVariablesTemplate>(data.template(), &data)?,
                }),
            },
            data @ NotificationTemplateData::LabourCompletedWithNoteData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self
                        .render_subject::<templates::LabourCompletedWithNoteSubjectTemplate>(
                            data.template(),
                            &data,
                        )?,
                    html_body: self.render_body::<templates::LabourCompletedWithNoteBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Ok(RenderedContent::Sms {
                    body: self
                        .render_body::<templates::sms::labour_completed_with_note::LabourCompletedWithNoteTemplate>(data.template(), &data)?,
                }),
                NotificationChannel::WHATSAPP => Ok(RenderedContent::WhatsApp {
                    template_sid: self.render_subject::<templates::whatsapp::labour_completed_with_note::LabourCompletedWithNoteTemplateSid>(data.template(), &data)?,
                    content_variables: self.render_body::<templates::whatsapp::labour_completed_with_note::LabourCompletedWithNoteContentVariablesTemplate>(data.template(), &data)?,
                }),
            },
            data @ NotificationTemplateData::LabourUpdateData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::LabourUpdateSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::LabourUpdateBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Ok(RenderedContent::Sms {
                    body: self.render_body::<templates::sms::labour_update::LabourUpdateTemplate>(data.template(), &data)?,
                }),
                NotificationChannel::WHATSAPP => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
            },
            data @ NotificationTemplateData::LabourInviteData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::LabourInviteSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::LabourInviteBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
                NotificationChannel::WHATSAPP => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
            },
            data @ NotificationTemplateData::SubscriberInviteData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::SubscriberInviteSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::SubscriberInviteBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
                NotificationChannel::WHATSAPP => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
            },
            data @ NotificationTemplateData::SubscriberRequestedData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::SubscriberRequestedSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::SubscriberRequestedBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
                NotificationChannel::WHATSAPP => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
            },
            data @ NotificationTemplateData::SubscriberApprovedData { .. } => match channel {
                NotificationChannel::EMAIL => Ok(RenderedContent::Email {
                    subject: self.render_subject::<templates::SubscriberApprovedSubjectTemplate>(
                        data.template(),
                        &data,
                    )?,
                    html_body: self.render_body::<templates::SubscriberApprovedBodyTemplate>(
                        data.template(),
                        &data,
                    )?,
                }),
                NotificationChannel::SMS => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
                NotificationChannel::WHATSAPP => Err(AppError::ValidationError(format!(
                    "Template not found for channel {channel}"
                ))),
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use regex::Regex;

    fn create_engine() -> TinyTemplateEngine {
        TinyTemplateEngine::new()
    }

    fn assert_no_unresolved_brackets(content: &str, context: &str) {
        let without_escaped = content.replace("\\{", "").replace("\\}", "");

        let unresolved_pattern = Regex::new(r"\{[a-z_]+\}").unwrap();

        let matches: Vec<&str> = unresolved_pattern
            .find_iter(&without_escaped)
            .map(|m| m.as_str())
            .collect();

        assert!(
            matches.is_empty(),
            "{} contains unresolved template variables: {:?}",
            context,
            matches
        );
    }

    fn assert_valid_html(html: &str, context: &str) {
        assert!(
            html.contains("<!doctype html>") || html.contains("<!DOCTYPE html>"),
            "{} should contain DOCTYPE",
            context
        );
        assert!(
            html.contains("<html"),
            "{} should contain html tag",
            context
        );
        assert!(
            html.contains("</html>"),
            "{} should contain closing html tag",
            context
        );
    }

    #[test]
    fn test_labour_begun_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourBegunData {
            birthing_person_name: "Jane Smith".to_string(),
            birthing_person_first_name: "Jane".to_string(),
            subscriber_first_name: "John".to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "LabourBegun email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(
                subject.contains("Jane Smith"),
                "Subject should contain birthing person name"
            );
            assert_no_unresolved_brackets(&subject, "LabourBegun subject");
            assert_no_unresolved_brackets(&html_body, "LabourBegun body");
            assert_valid_html(&html_body, "LabourBegun body");
            assert!(
                html_body.contains("John"),
                "Body should contain subscriber name"
            );
            assert!(
                html_body.contains("Jane"),
                "Body should contain birthing person first name"
            );
        }
    }

    #[test]
    fn test_labour_completed_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourCompletedData {
            birthing_person_name: "Jane Smith".to_string(),
            birthing_person_first_name: "Jane".to_string(),
            subscriber_first_name: "John".to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "LabourCompleted email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(!subject.is_empty(), "Subject should not be empty");
            assert_no_unresolved_brackets(&subject, "LabourCompleted subject");
            assert_no_unresolved_brackets(&html_body, "LabourCompleted body");
            assert_valid_html(&html_body, "LabourCompleted body");
        }
    }

    #[test]
    fn test_labour_completed_with_note_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourCompletedWithNoteData {
            birthing_person_name: "Jane Smith".to_string(),
            birthing_person_first_name: "Jane".to_string(),
            subscriber_first_name: "John".to_string(),
            update: "Baby has arrived! 8lbs 4oz, everyone is healthy.".to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "LabourCompletedWithNote email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(!subject.is_empty(), "Subject should not be empty");
            assert_no_unresolved_brackets(&subject, "LabourCompletedWithNote subject");
            assert_no_unresolved_brackets(&html_body, "LabourCompletedWithNote body");
            assert_valid_html(&html_body, "LabourCompletedWithNote body");
            assert!(
                html_body.contains("Baby has arrived"),
                "Body should contain the update message"
            );
        }
    }

    #[test]
    fn test_labour_announcement_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourAnnouncementData {
            birthing_person_name: "Jane Smith".to_string(),
            birthing_person_first_name: "Jane".to_string(),
            subscriber_first_name: "John".to_string(),
            announcement: "We're so excited to share that everything is progressing well!"
                .to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "LabourAnnouncement email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(
                subject.contains("Jane Smith"),
                "Subject should contain birthing person name"
            );
            assert_no_unresolved_brackets(&subject, "LabourAnnouncement subject");
            assert_no_unresolved_brackets(&html_body, "LabourAnnouncement body");
            assert_valid_html(&html_body, "LabourAnnouncement body");
            assert!(
                html_body.contains("excited to share"),
                "Body should contain announcement"
            );
        }
    }

    #[test]
    fn test_labour_update_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourUpdateData {
            birthing_person_name: "Jane Smith".to_string(),
            subscriber_first_name: "John".to_string(),
            update: "Labour is progressing - 6cm dilated now.".to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
            notes: Some("Thanks for all your support!".to_string()),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "LabourUpdate email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(!subject.is_empty(), "Subject should not be empty");
            assert_no_unresolved_brackets(&subject, "LabourUpdate subject");
            assert_no_unresolved_brackets(&html_body, "LabourUpdate body");
            assert_valid_html(&html_body, "LabourUpdate body");
        }
    }

    #[test]
    fn test_labour_invite_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourInviteData {
            birthing_person_name: "Jane Smith".to_string(),
            birthing_person_first_name: "Jane".to_string(),
            link: "https://app.fernlabour.com/invite/abc123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "LabourInvite email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(!subject.is_empty(), "Subject should not be empty");
            assert_no_unresolved_brackets(&subject, "LabourInvite subject");
            assert_no_unresolved_brackets(&html_body, "LabourInvite body");
            assert_valid_html(&html_body, "LabourInvite body");
            assert!(
                html_body.contains("Jane Smith"),
                "Body should contain birthing person name"
            );
        }
    }

    #[test]
    fn test_subscriber_invite_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::SubscriberInviteData {
            subscriber_name: "Grandma Mary".to_string(),
            link: "https://app.fernlabour.com/invite/xyz789".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "SubscriberInvite email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(!subject.is_empty(), "Subject should not be empty");
            assert_no_unresolved_brackets(&subject, "SubscriberInvite subject");
            assert_no_unresolved_brackets(&html_body, "SubscriberInvite body");
            assert_valid_html(&html_body, "SubscriberInvite body");
            assert!(
                html_body.contains("Grandma Mary"),
                "Body should contain subscriber name"
            );
        }
    }

    #[test]
    fn test_subscriber_requested_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::SubscriberRequestedData {
            birthing_person_first_name: "Jane".to_string(),
            subscriber_name: "Aunt Susan".to_string(),
            link: "https://app.fernlabour.com/requests".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "SubscriberRequested email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(
                subject.contains("Aunt Susan"),
                "Subject should contain subscriber name"
            );
            assert_no_unresolved_brackets(&subject, "SubscriberRequested subject");
            assert_no_unresolved_brackets(&html_body, "SubscriberRequested body");
            assert_valid_html(&html_body, "SubscriberRequested body");
            assert!(
                html_body.contains("Aunt Susan"),
                "Body should contain subscriber name"
            );
            assert!(
                html_body.contains("Jane"),
                "Body should contain birthing person first name"
            );
        }
    }

    #[test]
    fn test_subscriber_approved_email_renders_successfully() {
        let engine = create_engine();
        let data = NotificationTemplateData::SubscriberApprovedData {
            subscriber_first_name: "Susan".to_string(),
            birthing_person_name: "Jane Smith".to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "SubscriberApproved email should render: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            assert!(!subject.is_empty(), "Subject should not be empty");
            assert_no_unresolved_brackets(&subject, "SubscriberApproved subject");
            assert_no_unresolved_brackets(&html_body, "SubscriberApproved body");
            assert_valid_html(&html_body, "SubscriberApproved body");
            assert!(
                html_body.contains("Susan"),
                "Body should contain subscriber first name"
            );
            assert!(
                html_body.contains("Jane Smith"),
                "Body should contain birthing person name"
            );
        }
    }

    #[test]
    fn test_templates_handle_special_characters_in_names() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourBegunData {
            birthing_person_name: "O'Connor-Smith".to_string(),
            birthing_person_first_name: "Mary-Jane".to_string(),
            subscriber_first_name: "José".to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "Template should handle special characters: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { subject, html_body }) = result {
            let contains_name =
                subject.contains("O&#39;Connor-Smith") || subject.contains("O'Connor-Smith");
            assert!(
                contains_name,
                "Subject should contain the name (encoded or not): {}",
                subject
            );
            assert_no_unresolved_brackets(&html_body, "Special chars body");
            assert!(
                html_body.contains("Mary-Jane") || html_body.contains("Mary-Jane"),
                "Body should contain first name"
            );
        }
    }

    #[test]
    fn test_templates_handle_emoji_in_content() {
        let engine = create_engine();
        let data = NotificationTemplateData::LabourAnnouncementData {
            birthing_person_name: "Jane".to_string(),
            birthing_person_first_name: "Jane".to_string(),
            subscriber_first_name: "John".to_string(),
            announcement: "Baby is here! 👶🎉❤️".to_string(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "Template should handle emojis: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { html_body, .. }) = result {
            assert!(html_body.contains("👶"), "Body should contain baby emoji");
            assert_no_unresolved_brackets(&html_body, "Emoji body");
        }
    }

    #[test]
    fn test_templates_handle_long_content() {
        let engine = create_engine();
        let long_update = "A".repeat(1000);
        let data = NotificationTemplateData::LabourUpdateData {
            birthing_person_name: "Jane".to_string(),
            subscriber_first_name: "John".to_string(),
            update: long_update.clone(),
            link: "https://app.fernlabour.com/circle/123".to_string(),
            notes: None,
        };

        let result = engine.render_content(NotificationChannel::EMAIL, data);
        assert!(
            result.is_ok(),
            "Template should handle long content: {:?}",
            result.err()
        );

        if let Ok(RenderedContent::Email { html_body, .. }) = result {
            assert!(
                html_body.contains(&long_update),
                "Body should contain long update"
            );
            assert_no_unresolved_brackets(&html_body, "Long content body");
        }
    }
}
