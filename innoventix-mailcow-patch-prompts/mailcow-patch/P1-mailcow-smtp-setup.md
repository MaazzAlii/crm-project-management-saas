# P1: Mailcow SMTP setup (replaces prompt 04)

Email is sent over SMTP with a dedicated app mailbox. Read these environment variables only:
- EMAIL_PROVIDER=smtp (allowed values: smtp, console)
- EMAIL_FROM_ADDRESS (for example noreply@company-domain)
- EMAIL_FROM_NAME (default "Innoventix")
- EMAIL_REPLY_TO (default support@company-domain)
- SMTP_HOST (the Mailcow hostname, for example mail.company-domain)
- SMTP_PORT (587)
- SMTP_SECURE (false for STARTTLS on 587; true only for port 465)
- SMTP_REQUIRE_TLS (true)
- SMTP_USER (the app mailbox)
- SMTP_PASSWORD (the app mailbox password, never committed)
- APP_PUBLIC_URL (for example https://project-manager.calara.agency)

Rules:
- Remove RESEND_API_KEY and any Resend-only code (see P4).
- Startup check: in production, EMAIL_PROVIDER must be smtp and every SMTP variable must be set. Otherwise the app refuses to start with a message that names the missing variable, not its value.
- console is allowed only in development (see prompt 31).
- Use nodemailer (install it) for SMTP. Enable TLS verification; do not disable certificate checks, even for Mailcow self-signed certificates. If the certificate is not trusted, the fix is to install the Mailcow certificate chain, not to turn verification off.
- Add a config check that prints which variables are set, without printing values.

Test:
- Missing SMTP_PASSWORD in production fails startup.
- Console provider in production fails startup.
- Certificate verification is on.
