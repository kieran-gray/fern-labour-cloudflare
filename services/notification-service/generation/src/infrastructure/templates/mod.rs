pub mod email;
pub mod sms;
pub mod template;
pub mod whatsapp;

pub use email::contact_us::{ContactUsBodyTemplate, ContactUsSubjectTemplate};
pub use email::labour_announcement::{
    LabourAnnouncementBodyTemplate, LabourAnnouncementSubjectTemplate,
};
pub use email::labour_begun::{LabourBegunBodyTemplate, LabourBegunSubjectTemplate};
pub use email::labour_completed::{LabourCompletedBodyTemplate, LabourCompletedSubjectTemplate};
pub use email::labour_completed_with_note::{
    LabourCompletedWithNoteBodyTemplate, LabourCompletedWithNoteSubjectTemplate,
};
pub use email::labour_invite::{LabourInviteBodyTemplate, LabourInviteSubjectTemplate};
pub use email::labour_update::{LabourUpdateBodyTemplate, LabourUpdateSubjectTemplate};
pub use email::subscriber_approved::{
    SubscriberApprovedBodyTemplate, SubscriberApprovedSubjectTemplate,
};
pub use email::subscriber_invite::{SubscriberInviteBodyTemplate, SubscriberInviteSubjectTemplate};
pub use email::subscriber_requested::{
    SubscriberRequestedBodyTemplate, SubscriberRequestedSubjectTemplate,
};

pub use sms::labour_announcement::LabourAnnouncementTemplate;
pub use sms::labour_begun::LabourBegunTemplate;
pub use sms::labour_completed::LabourCompletedTemplate;
pub use sms::labour_completed_with_note::LabourCompletedWithNoteTemplate;
pub use sms::labour_update::LabourUpdateTemplate;
