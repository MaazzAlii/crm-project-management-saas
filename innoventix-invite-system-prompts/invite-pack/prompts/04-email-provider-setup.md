# 04: Email sending setup (no keys in code)

Add a sender configuration that reads these variables only:
- EMAIL_PROVIDER (resend or smtp or console)
- EMAIL_FROM (example: "Innoventix <invites@your-domain>")
- RESEND_API_KEY (only if provider is resend)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (only if provider is smtp)
- APP_PUBLIC_URL (for example https://project-manager.calara.agency)

Rules:
- Default provider is console in development: it prints the email, including the link, to the server log. In production, console is refused: the app fails to start if EMAIL_PROVIDER is console and NODE_ENV is production.
- Sender name shows the organization name where the email is about an invite, but the From address is always the platform's address. Explain this in a code comment.
- Write docs/email-setup.md with the variables and a note that the From domain needs SPF and DKIM records (I set those up in DNS).

Test: missing variables in production fail startup with a clear message.
