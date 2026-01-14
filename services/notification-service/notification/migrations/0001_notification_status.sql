-- Add migration script here
CREATE TABLE notification_status (
    notification_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_notification_status_user_id ON notification_status(notification_id, user_id);
