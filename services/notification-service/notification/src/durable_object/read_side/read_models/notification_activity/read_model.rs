use anyhow::{Result, anyhow};
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationActivity {
    pub count: i64,
    pub date: DateTime<Utc>,
}

impl NotificationActivity {
    pub fn new(count: i64, date: DateTime<Utc>) -> Self {
        Self { count, date }
    }
}

#[derive(Debug, Deserialize)]
pub struct NotificationActivityRow {
    pub count: i64,
    pub date: String,
}

impl NotificationActivityRow {
    pub fn into_read_model(self) -> Result<NotificationActivity> {
        Ok(NotificationActivity {
            count: self.count,
            date: Self::parse_date(&self.date)?,
        })
    }

    fn parse_date(date_str: &str) -> Result<DateTime<Utc>> {
        let naive_date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
            .map_err(|e| anyhow!("Invalid date format (expected YYYY-MM-DD): {}", e))?;

        let datetime = naive_date
            .and_hms_opt(0, 0, 0)
            .ok_or_else(|| anyhow!("Failed to create datetime"))?
            .and_utc();

        Ok(datetime)
    }
}
