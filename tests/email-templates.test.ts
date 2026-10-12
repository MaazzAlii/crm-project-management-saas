import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  escapeHtml,
  renderInviteEmail,
  renderVerifyEmail,
  renderDomainCodeEmail,
  renderInviteAcceptedEmail,
  renderRoleChangedEmail,
  buildInviteEmail,
} from '../lib/email/templates';

describe('Prompt 30: Email Templates', () => {
  const originalPublicUrl = process.env.APP_PUBLIC_URL;

  beforeEach(() => {
    process.env.APP_PUBLIC_URL = 'https://custom.innoventix.io';
  });

  afterEach(() => {
    process.env.APP_PUBLIC_URL = originalPublicUrl;
  });

  it('1. escapeHtml: escapes malicious HTML and script tags', () => {
    const malicious = '<script>alert("XSS")</script> & "quotes" \'single\'';
    const clean = escapeHtml(malicious);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('&lt;script&gt;');
    expect(clean).toContain('&amp;');
    expect(clean).toContain('&quot;');
    expect(clean).toContain('&#039;');
  });

  it('2. invite template: escapes names, builds links from APP_PUBLIC_URL, includes plain-text and required notice', () => {
    const email = renderInviteEmail({
      inviterName: '<script>Bob</script>',
      organizationName: '<b>Acme Corp</b>',
      role: 'admin',
      rawToken: 'secure_token_123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Subject
    expect(email.subject).toContain('&lt;script&gt;Bob&lt;/script&gt; invited you to &lt;b&gt;Acme Corp&lt;/b&gt; on Innoventix');

    // HTML escaping
    expect(email.html).not.toContain('<script>Bob</script>');
    expect(email.html).toContain('&lt;script&gt;Bob&lt;/script&gt;');
    expect(email.html).toContain('&lt;b&gt;Acme Corp&lt;/b&gt;');

    // Link uses APP_PUBLIC_URL
    expect(email.html).toContain('https://custom.innoventix.io/invite/secure_token_123');
    expect(email.text).toContain('https://custom.innoventix.io/invite/secure_token_123');

    // Required disclaimer
    expect(email.html).toContain('If you did not expect this, ignore this email.');
    expect(email.text).toContain('If you did not expect this, ignore this email.');

    // Plain text content
    expect(email.text).toContain('admin');
  });

  it('3. buildInviteEmail (P2 Mailcow Patch): sets From, DisplayName, Reply-To, escaped HTML, and APP_PUBLIC_URL', () => {
    // Unverified inviter falls back to EMAIL_REPLY_TO
    const emailUnverified = buildInviteEmail(
      { name: '<b>Maaz Ali</b>', email: 'maaz@personal.com', isVerified: false },
      { name: '<i>Innoventix Hub</i>' },
      { email: 'invitee@client.com' },
      'tok_456'
    );
    expect(emailUnverified.displayName).toContain('&lt;b&gt;Maaz Ali&lt;/b&gt; via');
    expect(emailUnverified.from).not.toBe('maaz@personal.com');
    expect(emailUnverified.replyTo).not.toBe('maaz@personal.com');
    expect(emailUnverified.html).toContain('&lt;b&gt;Maaz Ali&lt;/b&gt;');
    expect(emailUnverified.html).toContain('&lt;i&gt;Innoventix Hub&lt;/i&gt;');
    expect(emailUnverified.html).toContain('https://custom.innoventix.io/invite/tok_456');
    expect(emailUnverified.text).toContain('https://custom.innoventix.io/invite/tok_456');

    // Verified inviter uses their email as Reply-To
    const emailVerified = buildInviteEmail(
      { name: 'Maaz Ali', email: 'maaz@innoventixhub.tech', isVerified: true },
      { name: 'Innoventix Hub' },
      { email: 'invitee@client.com' },
      'tok_456'
    );
    expect(emailVerified.replyTo).toBe('maaz@innoventixhub.tech');
    expect(emailVerified.from).not.toBe('maaz@innoventixhub.tech'); // From is platform address
  });

  it('4. verify-email template: includes 24-hour notice, APP_PUBLIC_URL link, and plain text', () => {
    const email = renderVerifyEmail({
      rawToken: 'token_abc',
      userEmail: 'user@example.com',
      userName: 'Alice',
    });

    expect(email.subject).toBe('Confirm your email');
    expect(email.html).toContain('https://custom.innoventix.io/verify-email?token=token_abc');
    expect(email.text).toContain('https://custom.innoventix.io/verify-email?token=token_abc');
    expect(email.html).toContain('24 hours');
    expect(email.text).toContain('24 hours');
  });

  it('5. domain-code template: includes 6-digit code, 30 minutes expiry, and plain text', () => {
    const email = renderDomainCodeEmail({
      code: '849201',
      domain: 'innoventix.io',
      rawToken: 'token_xyz',
    });

    expect(email.subject).toBe('Your domain verification code');
    expect(email.html).toContain('849201');
    expect(email.text).toContain('849201');
    expect(email.html).toContain('30 minutes');
    expect(email.text).toContain('30 minutes');
    expect(email.html).toContain('innoventix.io');
  });

  it('6. invite-accepted template: subject "{name} joined {organization}"', () => {
    const email = renderInviteAcceptedEmail({
      memberName: 'Sarah Connor',
      organizationName: 'Cyberdyne Systems',
      role: 'member',
    });

    expect(email.subject).toBe('Sarah Connor joined Cyberdyne Systems');
    expect(email.html).toContain('Sarah Connor');
    expect(email.html).toContain('Cyberdyne Systems');
    expect(email.text).toContain('Sarah Connor');
    expect(email.text).toContain('Cyberdyne Systems');
  });

  it('7. role-changed template: notifies member of their updated role', () => {
    const email = renderRoleChangedEmail({
      memberName: 'John Doe',
      organizationName: 'Innoventix Hub',
      newRole: 'admin',
    });

    expect(email.subject).toContain('Innoventix Hub');
    expect(email.html).toContain('admin');
    expect(email.text).toContain('admin');
  });
});
