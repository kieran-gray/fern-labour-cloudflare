use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::fmt::{self, Display};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ScheduledAt(DateTime<Utc>);

impl ScheduledAt {
    pub const MIN_LEAD_TIME_MINUTES: i64 = 30;
    pub const MAX_LEAD_TIME_DAYS: i64 = 30;

    pub fn new(value: DateTime<Utc>) -> Result<Self, ScheduleValidationError> {
        Self::new_with_now(value, Utc::now())
    }

    pub fn new_with_now(
        value: DateTime<Utc>,
        now: DateTime<Utc>,
    ) -> Result<Self, ScheduleValidationError> {
        let min_time = now + Duration::minutes(Self::MIN_LEAD_TIME_MINUTES);
        let max_time = now + Duration::days(Self::MAX_LEAD_TIME_DAYS);

        if value < min_time {
            return Err(ScheduleValidationError::TooSoon {
                min_allowed: min_time,
                provided: value,
            });
        }

        if value >= max_time {
            return Err(ScheduleValidationError::TooFar {
                max_exclusive: max_time,
                provided: value,
            });
        }

        Ok(Self(value))
    }

    pub fn as_datetime(&self) -> &DateTime<Utc> {
        &self.0
    }

    pub fn timestamp(&self) -> String {
        self.0.to_rfc3339()
    }

    pub fn into_inner(self) -> DateTime<Utc> {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScheduleValidationError {
    TooSoon {
        min_allowed: DateTime<Utc>,
        provided: DateTime<Utc>,
    },
    TooFar {
        max_exclusive: DateTime<Utc>,
        provided: DateTime<Utc>,
    },
}

impl Display for ScheduleValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ScheduleValidationError::TooSoon {
                min_allowed,
                provided,
            } => write!(
                f,
                "Schedule must be at least {} minutes in the future. Provided: {}, minimum allowed: {}",
                ScheduledAt::MIN_LEAD_TIME_MINUTES,
                provided,
                min_allowed
            ),
            ScheduleValidationError::TooFar {
                max_exclusive,
                provided,
            } => write!(
                f,
                "Schedule must be less than {} days in the future. Provided: {}, maximum allowed (exclusive): {}",
                ScheduledAt::MAX_LEAD_TIME_DAYS,
                provided,
                max_exclusive
            ),
        }
    }
}

impl std::error::Error for ScheduleValidationError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_exactly_30_minutes_in_future() {
        let now = Utc::now();
        let scheduled = now + Duration::minutes(ScheduledAt::MIN_LEAD_TIME_MINUTES);

        let result = ScheduledAt::new_with_now(scheduled, now);
        assert!(result.is_ok());
    }

    #[test]
    fn rejects_less_than_30_minutes_in_future() {
        let now = Utc::now();
        let scheduled = now + Duration::minutes(ScheduledAt::MIN_LEAD_TIME_MINUTES - 1);

        let result = ScheduledAt::new_with_now(scheduled, now);
        assert!(matches!(
            result,
            Err(ScheduleValidationError::TooSoon { .. })
        ));
    }

    #[test]
    fn accepts_just_before_30_days() {
        let now = Utc::now();
        let scheduled =
            now + Duration::days(ScheduledAt::MAX_LEAD_TIME_DAYS) - Duration::seconds(1);

        let result = ScheduledAt::new_with_now(scheduled, now);
        assert!(result.is_ok());
    }

    #[test]
    fn rejects_exactly_30_days_in_future() {
        let now = Utc::now();
        let scheduled = now + Duration::days(ScheduledAt::MAX_LEAD_TIME_DAYS);

        let result = ScheduledAt::new_with_now(scheduled, now);
        assert!(matches!(
            result,
            Err(ScheduleValidationError::TooFar { .. })
        ));
    }
}
