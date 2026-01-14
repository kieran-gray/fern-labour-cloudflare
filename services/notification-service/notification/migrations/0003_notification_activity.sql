-- Add migration script here
CREATE TABLE notification_activity (
    count INTEGER NOT NULL,
    date TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_notification_activity_date ON notification_activity(date);
