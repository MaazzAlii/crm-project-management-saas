# 29: Email provider abstraction

Create lib/email/sender.ts with an interface send({ to, subject, html, text, replyTo? }).

Implementations: resend (HTTP API), smtp (nodemailer or the existing SMTP library if one is installed), console (development only).

Rules:
- Every email includes a plain-text version.
- The sender never logs the full recipient address in production; log a hash or the domain only.
- Errors return a typed result, not an exception to the caller.

Tests with a fake provider: success, failure, and a timeout.
