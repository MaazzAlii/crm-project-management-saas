# P2: Invitation sender identity (rules and implementation)

Rules for every invitation and account email:
1. From address: always the platform mailbox (EMAIL_FROM_ADDRESS). Never the inviter's address, never a personal address.
2. Display name: "{Inviter name} via {EMAIL_FROM_NAME}" for invites, so the recipient sees who invited them. For system emails (verification, domain code), use EMAIL_FROM_NAME alone.
3. Reply-To: the inviter's email only if that inviter's email is verified (prompt 39 flow). Otherwise EMAIL_REPLY_TO. This lets a reply reach the real person when possible, without sending from their mailbox.
4. Subject: "{Inviter name} invited you to {organization name}". Organization name appears in the body, not as the sender.
5. The email never includes the owner's password, the database, or the internal organization ID. It includes only the accept link and the expiry date.
6. Every message has an HTML version and a plain-text version.

Implementation:
- Add a function buildInviteEmail(inviter, organization, invitee, rawToken) that returns from, displayName, replyTo, subject, html, and text, following the rules above.
- Add tests for: From never equals the inviter's address; Reply-To falls back when the inviter is unverified; names with HTML are escaped; the link uses APP_PUBLIC_URL.
- Update the invite template (prompt 30) to use these fields.

Also write docs/invite-email-rules.md with these rules in plain language, so the company can read them.
