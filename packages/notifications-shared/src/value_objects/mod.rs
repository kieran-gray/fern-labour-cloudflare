pub mod notification_channel;
pub mod notification_destination;
pub mod notification_status;
pub mod notification_template_data;
pub mod rendered_content;

pub use crate::value_objects::{
    notification_channel::NotificationChannel,
    notification_destination::{EmailAddress, NotificationDestination, PhoneNumber, WhatsAppId},
    notification_status::NotificationStatus,
    notification_template_data::NotificationTemplateData,
    rendered_content::RenderedContent,
};
