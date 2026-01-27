ALTER TABLE labour_status ADD COLUMN deleted_at TEXT;
ALTER TABLE labour_status ADD COLUMN do_cleaned_up_at TEXT;

CREATE INDEX idx_labour_status_pending_cleanup ON labour_status(deleted_at, do_cleaned_up_at)
    WHERE deleted_at IS NOT NULL AND do_cleaned_up_at IS NULL;
