-- Add migration script here
CREATE TABLE notification_details (
    notification_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL,
    channel TEXT NOT NULL,
    destination TEXT NOT NULL,
    template TEXT NOT NULL,
    rendered_content TEXT,
    external_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    dispatched_at TEXT,
    delivered_at TEXT,
    failed_at TEXT
);

CREATE INDEX idx_notification_details_user_id ON notification_details(user_id, created_at DESC);
