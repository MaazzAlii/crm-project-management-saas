import { describe, it, expect } from 'vitest';
import {
  classifyEmail,
  PERSONAL_EMAIL_DOMAINS,
  isPersonalEmailDomain,
} from '../lib/validation/business-email';

describe('Prompt 17: Business Email Check', () => {
  it('exports PERSONAL_EMAIL_DOMAINS list containing major consumer webmail domains', () => {
    expect(Array.isArray(PERSONAL_EMAIL_DOMAINS)).toBe(true);
    expect(PERSONAL_EMAIL_DOMAINS).toContain('gmail.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('yahoo.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('outlook.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('hotmail.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('icloud.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('proton.me');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('aol.com');
  });

  describe('classifyEmail', () => {
    it('classifies standard personal email providers as isPersonal=true, isBusinessCandidate=false', () => {
      const personalExamples = [
        'john.doe@gmail.com',
        'jane@yahoo.com',
        'user@outlook.com',
        'tester@hotmail.com',
        'apple.user@icloud.com',
        'privacy@proton.me',
        'oldtimer@aol.com',
      ];

      for (const email of personalExamples) {
        const result = classifyEmail(email);
        expect(result.isPersonal).toBe(true);
        expect(result.isBusinessCandidate).toBe(false);
        expect(result.domain).toBe(email.split('@')[1]);
      }
    });

    it('classifies company domain as isPersonal=false, isBusinessCandidate=true', () => {
      const companyExamples = [
        'alex@innoventix.io',
        'ceo@acme-corp.com',
        'developer@stripe.com',
        'contact@startup.ai',
      ];

      for (const email of companyExamples) {
        const result = classifyEmail(email);
        expect(result.isPersonal).toBe(false);
        expect(result.isBusinessCandidate).toBe(true);
        expect(result.domain).toBe(email.split('@')[1]);
      }
    });

    it('handles personal provider subdomains as personal', () => {
      const subdomains = [
        'user@mail.gmail.com',
        'member@sub.yahoo.com',
      ];

      for (const email of subdomains) {
        const result = classifyEmail(email);
        expect(result.isPersonal).toBe(true);
        expect(result.isBusinessCandidate).toBe(false);
      }
    });

    it('handles enterprise company subdomains as business candidates', () => {
      const result = classifyEmail('ops@internal.innoventix.io');
      expect(result.domain).toBe('internal.innoventix.io');
      expect(result.isPersonal).toBe(false);
      expect(result.isBusinessCandidate).toBe(true);
    });

    it('handles case-insensitivity and whitespace in input', () => {
      const result = classifyEmail('  BOSS@GMAIL.COM  ');
      expect(result.domain).toBe('gmail.com');
      expect(result.isPersonal).toBe(true);
      expect(result.isBusinessCandidate).toBe(false);
    });

    it('handles invalid or empty email inputs safely', () => {
      expect(classifyEmail('')).toEqual({
        domain: '',
        isPersonal: false,
        isBusinessCandidate: false,
      });

      expect(classifyEmail('no-at-sign')).toEqual({
        domain: '',
        isPersonal: false,
        isBusinessCandidate: false,
      });

      // @ts-expect-error test runtime resilience
      expect(classifyEmail(null)).toEqual({
        domain: '',
        isPersonal: false,
        isBusinessCandidate: false,
      });
    });
  });

  describe('isPersonalEmailDomain', () => {
    it('returns true for exact matches and subdomains of personal providers', () => {
      expect(isPersonalEmailDomain('gmail.com')).toBe(true);
      expect(isPersonalEmailDomain('sub.outlook.com')).toBe(true);
      expect(isPersonalEmailDomain('innoventix.io')).toBe(false);
    });
  });
});
