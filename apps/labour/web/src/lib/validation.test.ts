import {
  CONTACT_MESSAGE_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  LABOUR_NAME_MAX_LENGTH,
} from '@base/lib/constants';
import { validateEmail, validateLabourName, validateMessage } from '@lib/validation';

describe('validateEmail', () => {
  describe('valid emails', () => {
    it('should return true for simple valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('should return true for email with numbers', () => {
      expect(validateEmail('user123@example456.com')).toBe(true);
    });

    it('should return true for email with special characters in local part', () => {
      expect(validateEmail('user.name+tag@example.com')).toBe(true);
    });

    it('should return true for short email', () => {
      expect(validateEmail('a@b.co')).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should return false for email without @ symbol', () => {
      expect(validateEmail('testexample.com')).toBe(false);
    });

    it('should return false for email with multiple @ symbols', () => {
      expect(validateEmail('test@@example.com')).toBe(false);
    });

    it('should return false for email without domain', () => {
      expect(validateEmail('test@')).toBe(false);
    });

    it('should return false for email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should return false for email with spaces', () => {
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail('test@ example.com')).toBe(false);
      expect(validateEmail(' test@example.com')).toBe(false);
      expect(validateEmail('test@example.com ')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should return false for email that exceeds max length', () => {
      const longEmail = `${'a'.repeat(EMAIL_MAX_LENGTH - 10)}@example.com`;
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return true for email at max length boundary', () => {
      // Create an email that's exactly at the max length
      const maxLengthEmail = `${'a'.repeat(EMAIL_MAX_LENGTH - 12)}@example.com`;
      expect(validateEmail(maxLengthEmail)).toBe(true);
    });

    it('should handle null or undefined gracefully', () => {
      // These will cause TypeScript errors but test runtime behavior
      expect(() => validateEmail(null as any)).not.toThrow();
      expect(() => validateEmail(undefined as any)).not.toThrow();
    });

    it('should return false for email with only @ symbol', () => {
      expect(validateEmail('@')).toBe(false);
    });

    it('should return false for email with tabs or newlines', () => {
      expect(validateEmail('test\t@example.com')).toBe(false);
      expect(validateEmail('test@example.com\n')).toBe(false);
    });
  });
});

describe('validateMessage', () => {
  describe('valid messages', () => {
    it('should return true for simple message', () => {
      expect(validateMessage('Hello abc 123 !@#$%')).toBe(null);
    });

    it('should return null for short message', () => {
      expect(validateMessage('a')).toBe(null);
    });
  });

  describe('invalid messages', () => {
    it('should return error string for message that exceeds max length', () => {
      const message = `${'a'.repeat(CONTACT_MESSAGE_MAX_LENGTH + 1)}`;
      expect(validateMessage(message)).toBe(
        `Message exceeds maximum length of ${CONTACT_MESSAGE_MAX_LENGTH} characters.`
      );
    });
  });

  describe('edge cases', () => {
    it('should return null for message at max length boundary', () => {
      const makeLengthMessage = `${'a'.repeat(CONTACT_MESSAGE_MAX_LENGTH)}`;
      expect(validateMessage(makeLengthMessage)).toBe(null);
    });

    it('should handle null or undefined gracefully', () => {
      expect(() => validateMessage(null as any)).not.toThrow();
      expect(() => validateMessage(undefined as any)).not.toThrow();
    });
  });
});

describe('validateLabourName', () => {
  describe('valid labour names', () => {
    it('should return true for simple labour name', () => {
      expect(validateLabourName('Hello abc 123 !@#$%')).toBe(null);
    });

    it('should return null for short labour name', () => {
      expect(validateLabourName('a')).toBe(null);
    });
  });

  describe('invalid labour names', () => {
    it('should return error string for labour name that exceeds max length', () => {
      const labourName = `${'a'.repeat(LABOUR_NAME_MAX_LENGTH + 1)}`;
      expect(validateLabourName(labourName)).toBe(
        `Labour Name exceeds maximum length of ${LABOUR_NAME_MAX_LENGTH} characters.`
      );
    });
  });

  describe('edge cases', () => {
    it('should return null for message at max length boundary', () => {
      const maxLengthLabourName = `${'a'.repeat(LABOUR_NAME_MAX_LENGTH)}`;
      expect(validateLabourName(maxLengthLabourName)).toBe(null);
    });

    it('should handle null or undefined gracefully', () => {
      expect(() => validateLabourName(null as any)).not.toThrow();
      expect(() => validateLabourName(undefined as any)).not.toThrow();
    });
  });
});
