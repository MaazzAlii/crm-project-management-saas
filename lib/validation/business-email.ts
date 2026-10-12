import { normalizeEmail } from './email';

/**
 * Common consumer and personal webmail domains.
 * Maintained in this single configuration list for straightforward extensibility.
 */
export const PERSONAL_EMAIL_DOMAINS: readonly string[] = Object.freeze([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
  'yandex.ru',
  'fastmail.com',
  'tutanota.com',
  'tutamail.com',
]);

const personalDomainsSet = new Set(PERSONAL_EMAIL_DOMAINS);

/**
 * Result of email domain classification.
 */
export interface EmailClassification {
  domain: string;
  isPersonal: boolean;
  isBusinessCandidate: boolean;
}

/**
 * Checks whether a given domain (or any parent domain) is in the personal email domains list.
 * Handles subdomains such as `mail.gmail.com` -> `gmail.com`.
 *
 * @param domain Normalized domain string
 * @returns boolean
 */
export function isPersonalEmailDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  const cleanDomain = domain.trim().toLowerCase();
  if (personalDomainsSet.has(cleanDomain)) {
    return true;
  }

  // Check if it's a subdomain of any known personal provider
  for (const personalDomain of PERSONAL_EMAIL_DOMAINS) {
    if (cleanDomain.endsWith(`.${personalDomain}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Classifies an email address into personal vs business candidate without blocking.
 * Used to:
 * 1. Surface friendly notices when personal addresses are invited to professional workspaces.
 * 2. Assist in determining verified business domain badge status.
 *
 * @param email Raw email candidate
 * @returns EmailClassification result
 */
export function classifyEmail(email: string): EmailClassification {
  if (!email || typeof email !== 'string') {
    return {
      domain: '',
      isPersonal: false,
      isBusinessCandidate: false,
    };
  }

  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf('@');

  if (atIndex === -1 || atIndex === normalized.length - 1) {
    return {
      domain: '',
      isPersonal: false,
      isBusinessCandidate: false,
    };
  }

  const domain = normalized.slice(atIndex + 1);
  if (!domain || !domain.includes('.')) {
    return {
      domain: '',
      isPersonal: false,
      isBusinessCandidate: false,
    };
  }

  const isPersonal = isPersonalEmailDomain(domain);

  return {
    domain,
    isPersonal,
    isBusinessCandidate: !isPersonal,
  };
}
