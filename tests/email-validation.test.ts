import { describe, it, expect } from 'vitest';
import { normalizeEmail, isValidEmail } from '../lib/validation/email';

describe('Prompt 16: Email Normalization and Validation', () => {
  describe('normalizeEmail', () => {
    it('trims leading and trailing whitespace and lowercases the input', () => {
      expect(normalizeEmail('  Boss@Example.COM ')).toBe('boss@example.com');
      expect(normalizeEmail('\tAdmin@Innoventix.IO\n')).toBe('admin@innoventix.io');
    });

    it('strips surrounding single or double quotes', () => {
      expect(normalizeEmail('"Boss@Example.COM"')).toBe('boss@example.com');
      expect(normalizeEmail("'Boss@Example.COM'")).toBe('boss@example.com');
      expect(normalizeEmail('  "User@Domain.Com"  ')).toBe('user@domain.com');
      expect(normalizeEmail("  'User@Domain.Com'  ")).toBe('user@domain.com');
    });

    it('handles already normalized emails gracefully', () => {
      expect(normalizeEmail('alex@innoventix.io')).toBe('alex@innoventix.io');
    });

    it('handles empty or non-string input safely', () => {
      expect(normalizeEmail('')).toBe('');
      // @ts-expect-error test non-string runtime resilience
      expect(normalizeEmail(null)).toBe('');
      // @ts-expect-error test non-string runtime resilience
      expect(normalizeEmail(undefined)).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('accepts standard valid email addresses', () => {
      expect(isValidEmail('boss@example.com')).toBe(true);
      expect(isValidEmail('first.last@innoventix.io')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('operations_123@sub.domain.org')).toBe(true);
    });

    it('rejects empty or whitespace-only inputs', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
      // @ts-expect-error test runtime type safety
      expect(isValidEmail(null)).toBe(false);
      // @ts-expect-error test runtime type safety
      expect(isValidEmail(undefined)).toBe(false);
    });

    it('rejects emails with length exceeding 254 characters', () => {
      const longLocal = 'a'.repeat(245);
      const email = `${longLocal}@example.com`; // > 254 chars
      expect(email.length).toBeGreaterThan(254);
      expect(isValidEmail(email)).toBe(false);

      // Local part max 64, domain max 255, total max 254
      const localPart = 'a'.repeat(64);
      const domainPart = `${'b'.repeat(60)}.${'c'.repeat(60)}.com`;
      const validLengthEmail = `${localPart}@${domainPart}`;
      expect(validLengthEmail.length).toBeLessThanOrEqual(254);
      expect(isValidEmail(validLengthEmail)).toBe(true);
    });

    it('rejects emails with missing or multiple @ signs', () => {
      expect(isValidEmail('boss-example.com')).toBe(false);
      expect(isValidEmail('boss@@example.com')).toBe(false);
      expect(isValidEmail('boss@sub@example.com')).toBe(false);
    });

    it('rejects emails without local part or without domain', () => {
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('boss@')).toBe(false);
      expect(isValidEmail('boss')).toBe(false);
    });

    it('rejects domains without a dot or with invalid dot positioning', () => {
      expect(isValidEmail('boss@localhost')).toBe(false);
      expect(isValidEmail('boss@example')).toBe(false);
      expect(isValidEmail('boss@.example.com')).toBe(false);
      expect(isValidEmail('boss@example.com.')).toBe(false);
      expect(isValidEmail('boss@example..com')).toBe(false);
    });

    it('rejects addresses with spaces inside', () => {
      expect(isValidEmail('boss @example.com')).toBe(false);
      expect(isValidEmail('boss@ example.com')).toBe(false);
      expect(isValidEmail('bo ss@example.com')).toBe(false);
      expect(isValidEmail('boss@exam ple.com')).toBe(false);
    });

    it('rejects addresses with ASCII and unicode control characters', () => {
      // Null byte and ASCII control characters (0x00 - 0x1F, 0x7F)
      expect(isValidEmail('boss\x00@example.com')).toBe(false);
      expect(isValidEmail('boss\x07@example.com')).toBe(false);
      expect(isValidEmail('boss\x1B@example.com')).toBe(false);
      expect(isValidEmail('boss\x7F@example.com')).toBe(false);
      expect(isValidEmail('boss@example\x0A.com')).toBe(false);

      // Unicode format / control characters
      expect(isValidEmail('boss\u200B@example.com')).toBe(false); // zero-width space
      expect(isValidEmail('boss\u202E@example.com')).toBe(false); // right-to-left override
      expect(isValidEmail('boss\u0080@example.com')).toBe(false);
    });
  });
});
