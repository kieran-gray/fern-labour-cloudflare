// updateTime.test.ts
import { updateTime } from '@lib/calculations';

describe('updateTime', () => {
  describe('day boundary crossings', () => {
    test('should go to previous day when new time is just before midnight and original is just after', () => {
      const original = '2024-01-15T00:00:01.000Z'; // Just after midnight
      const newTime = '23:59:56'; // Just before midnight
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-14T23:59:56.000Z');
    });

    test('should go to next day when new time is just after midnight and original is just before', () => {
      const original = '2024-01-15T23:59:56.000Z'; // Just before midnight
      const newTime = '00:00:01'; // Just after midnight
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-16T00:00:01.000Z');
    });

    test('should stay on same day for small time differences', () => {
      const original = '2024-01-15T12:30:00.000Z';
      const newTime = '12:35:00';
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T12:35:00.000Z');
    });
  });

  describe('edge cases around midnight', () => {
    test('should handle exact midnight correctly', () => {
      const original = '2024-01-15T00:00:00.000Z';
      const newTime = '00:00:30';
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T00:00:30.000Z');
    });
  });

  describe('same day updates', () => {
    test('should handle morning to afternoon update', () => {
      const original = '2024-01-15T09:15:30.000Z';
      const newTime = '14:22:45';
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T14:22:45.000Z');
    });

    test('should handle afternoon to morning update', () => {
      const original = '2024-01-15T15:30:00.000Z';
      const newTime = '08:45:15';
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T08:45:15.000Z');
    });
  });

  describe('practical contraction scenarios', () => {
    test('should handle shortening a contraction by a few seconds', () => {
      const original = '2024-01-15T14:32:45.000Z';
      const newTime = '14:32:40'; // 5 seconds earlier
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T14:32:40.000Z');
    });

    test('should handle extending a contraction by a few minutes', () => {
      const original = '2024-01-15T14:32:45.000Z';
      const newTime = '14:35:15'; // About 2.5 minutes later
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T14:35:15.000Z');
    });

    test('should handle late night contraction adjustments', () => {
      const original = '2024-01-15T23:58:30.000Z';
      const newTime = '23:55:45'; // Few minutes earlier
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T23:55:45.000Z');
    });

    test('should handle early morning contraction adjustments', () => {
      const original = '2024-01-15T00:02:15.000Z';
      const newTime = '00:05:30'; // Few minutes later
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T00:05:30.000Z');
    });
  });

  describe('different time formats', () => {
    test('should handle seconds included in time string', () => {
      const original = '2024-01-15T14:32:45.000Z';
      const newTime = '14:35:20';
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-15T14:35:20.000Z');
    });
  });

  describe('month/year boundary crossings', () => {
    test('should handle crossing month boundary', () => {
      const original = '2024-02-01T00:01:15.000Z'; // Start of Feb
      const newTime = '23:59:30'; // End of previous day
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-31T23:59:30.000Z');
    });

    test('should handle crossing month boundary', () => {
      const original = '2024-01-31T23:59:30.000Z'; // End of January
      const newTime = '00:01:15'; // Early next day (February 1st)
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-02-01T00:01:15.000Z');
    });

    test('should handle crossing year boundary', () => {
      const original = '2023-12-31T23:58:45.000Z'; // End of 2023
      const newTime = '00:02:30'; // Early 2024
      const result = updateTime(original, newTime);

      expect(result).toBe('2024-01-01T00:02:30.000Z');
    });
  });

  describe('timezone handling', () => {
    test('should preserve timezone context in ISO string', () => {
      const original = '2024-01-15T14:32:45.123Z';
      const newTime = '15:30:00';
      const result = updateTime(original, newTime);

      // Should maintain ISO format and timezone
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result).toBe('2024-01-15T15:30:00.000Z');
    });
  });
});
