# Team Invitation Email Rules & Architecture

Guidelines for team invitations and transactional notifications in Innoventix Hub.

---

## 1. Sender Identity & Domain Alignment

- **From Address**: Always sent from the official platform mailbox (`EMAIL_FROM_ADDRESS`, e.g. `invites@innoventix.io`). Invitations are never sent from personal addresses or an inviter's private mailbox. This guarantees strict SPF and DKIM authentication alignment.
- **Display Name**: Displays as `"{Inviter name} via Innoventix"` (e.g. `Maaz Ali via Innoventix`), ensuring the invitee immediately recognizes who invited them. System alerts (email confirmation, domain codes) use the platform name alone.
- **Reply-To**: Set to the inviter's email address **only if** their email is verified. If unverified, it falls back to the platform support mailbox (`EMAIL_REPLY_TO`, e.g. `support@innoventix.io`).

## 2. Content & Privacy Standards

- **Plain-Text Version**: Every outgoing email must contain both HTML and plain-text versions.
- **Security & Token Safety**: Emails never expose database IDs, passwords, or token hashes. They contain only the secure one-time redemption link and expiration date.
- **XSS Protection**: All user-supplied strings (names, company names) are automatically HTML-escaped.
- **Legitimacy Notice**: Every invitation email includes the standard security disclaimer: *"If you did not expect this, ignore this email."*

## 3. Email Templates Summary

| Template | Purpose | Subject Format | Expiry |
|---|---|---|---|
| **Team Invite** | Invite a colleague to a workspace | `{Inviter} invited you to {Organization} on Innoventix` | 7 Days |
| **Verify Email** | Account email confirmation | `Confirm your email` | 24 Hours |
| **Domain Code** | Business domain verification | `Your domain verification code` | 30 Minutes |
| **Invite Accepted**| Alert inviter that invitee joined | `{Member} joined {Organization}` | N/A |
| **Role Changed** | Alert member of role modification | `Your role in {Organization} was updated` | N/A |
