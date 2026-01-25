use serde::{Deserialize, Serialize};
use strum::EnumString;

#[derive(Debug, Clone, Deserialize, Serialize, EnumString, PartialEq)]
pub enum NotificationStatus {
    #[strum(serialize = "REQUESTED", serialize = "requested")]
    REQUESTED,
    #[strum(serialize = "RENDERED", serialize = "rendered")]
    RENDERED,
    #[strum(serialize = "SENT", serialize = "sent")]
    SENT,
    #[strum(serialize = "FAILED", serialize = "failed")]
    FAILED,
    #[strum(serialize = "DELIVERED", serialize = "delivered")]
    DELIVERED,
    #[strum(serialize = "REDACTED", serialize = "redacted")]
    REDACTED,
    #[strum(serialize = "DELETED", serialize = "deleted")]
    DELETED,
}

impl std::fmt::Display for NotificationStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            NotificationStatus::REQUESTED => write!(f, "REQUESTED"),
            NotificationStatus::RENDERED => write!(f, "RENDERED"),
            NotificationStatus::SENT => write!(f, "SENT"),
            NotificationStatus::FAILED => write!(f, "FAILED"),
            NotificationStatus::DELIVERED => write!(f, "DELIVERED"),
            NotificationStatus::REDACTED => write!(f, "REDACTED"),
            NotificationStatus::DELETED => write!(f, "DELETED"),
        }
    }
}
