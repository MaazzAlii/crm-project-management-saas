/**
 * Email normalization and validation utilities for multi-tenant invitation & auth pipelines.
 * Enforces RFC 5321 length limits, robust formatting rules, and strict control character filtering.
 */

/**
 * Trims leading/trailing whitespace, strips surrounding single or double quotes,
 * and converts the email address to lowercase.
 *
 * @param input Raw email string
 * @returns Normalized email string (lowercase, trimmed, unquoted)
 */
export function normalizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let trimmed = input.trim();

  // Strip surrounding quotes if present (double or single quotes)
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  return trimmed.toLowerCase();
}

/**
 * Validates an email address against practical, robust RFC criteria:
 * - Total length between 1 and 254 characters (RFC 5321)
 * - Exactly one '@' character separating local-part and domain
 * - No whitespace characters
 * - No ASCII control characters (0x00-0x1F, 0x7F) or Unicode control/formatting characters
 * - Local-part is non-empty, max 64 characters, without leading/trailing/consecutive dots
 * - Domain is non-empty, contains at least one dot, without leading/trailing/consecutive dots
 * - Each domain label contains valid hostname characters (alphanumeric and hyphens)
 *
 * @param email Email candidate to validate
 * @returns boolean indicating validity
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }

  // Practical check: max length 254 characters (RFC 5321)
  if (!email || email.length > 254) {
    return false;
  }

  // Reject whitespace
  if (/\s/.test(email)) {
    return false;
  }

  // Reject ASCII control characters (0x00-0x1F, 0x7F-0x9F) and Unicode control / invisible format characters
  for (let i = 0; i < email.length; i++) {
    const code = email.charCodeAt(i);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return false;
    }
  }

  // Unicode control and formatting characters (\p{C})
  try {
    const unicodeControlRegex = new RegExp('\\p{C}', 'u');
    if (unicodeControlRegex.test(email)) {
      return false;
    }
  } catch {
    // Environment fallback
  }

  // Must contain exactly one '@'
  const atIndex = email.indexOf('@');
  if (atIndex === -1 || atIndex !== email.lastIndexOf('@')) {
    return false;
  }

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);

  if (!localPart || !domainPart) {
    return false;
  }

  // Local part max length check (RFC 5321 max 64)
  if (localPart.length > 64) {
    return false;
  }

  // Local part cannot start or end with a dot, or have consecutive dots
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return false;
  }

  // Domain cannot start or end with a dot, or have consecutive dots
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.includes('..')) {
    return false;
  }

  // Domain must contain at least one dot
  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) {
    return false;
  }

  // Each domain label must be non-empty and a valid hostname label (letters, digits, hyphens, not start/end with hyphen)
  const domainLabelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  for (const label of domainLabels) {
    if (!label || label.length > 63 || !domainLabelRegex.test(label)) {
      return false;
    }
  }

  // Standard local part character sanity check
  const localPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!localPartRegex.test(localPart)) {
    return false;
  }

  return true;
}
