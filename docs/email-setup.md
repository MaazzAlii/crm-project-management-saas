# Transactional Email Setup & Configuration

This guide details the configuration variables and DNS requirements for Innoventix team invitations and transactional email delivery.

---

## 1. Environment Variables Reference

| Variable | Provider | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `EMAIL_PROVIDER` | All | Selects active transactional mail transport (`console`, `resend`, or `smtp`) | `resend` / `smtp` / `console` |
| `EMAIL_FROM` | All | Default platform From header address | `Innoventix <invites@your-domain.com>` |
| `APP_PUBLIC_URL` | All | Base URL for invite links and verification callbacks | `https://project-manager.calara.agency` |
| `RESEND_API_KEY` | `resend` | Secret API key generated in Resend Dashboard | `re_123456789...` |
| `SMTP_HOST` | `smtp` | Outgoing SMTP server hostname | `smtp.mailcow.email` / `smtp.sendgrid.net` |
| `SMTP_PORT` | `smtp` | Outgoing SMTP server port | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER` | `smtp` | SMTP username / mailbox address | `invites@your-domain.com` |
| `SMTP_PASSWORD` | `smtp` | SMTP password / app password | `secret_smtp_password` |

---

## 2. Environment Behavior & Safety Rules

- **Development (`NODE_ENV=development`)**:
  - `EMAIL_PROVIDER` defaults to `console`.
  - Invitation and verification emails (including raw activation links) print directly to server output logs.
- **Production (`NODE_ENV=production`)**:
  - `EMAIL_PROVIDER=console` is **strictly refused**. The application throws a startup validation error if `console` is selected or if credentials for `resend` or `smtp` are missing.

---

## 3. Sender Name & From Address Rule

- For team invitations, the sender display name shows the **inviting organization name** (e.g. `Acme Corp via Innoventix`).
- The actual RFC From address **always remains the platform's domain** (e.g. `<invites@your-domain.com>`).
- This guarantees that outbound emails pass SPF and DKIM alignment checks regardless of tenant organization names.

---

## 4. DNS Configuration: SPF, DKIM, and DMARC

To guarantee deliverability and prevent emails from landing in spam or being rejected, configure the following DNS records for the domain matching `EMAIL_FROM`:

### 1. SPF (Sender Policy Framework)
- **Type**: `TXT`
- **Host**: `@` (or subdomain)
- **Value**: `v=spf1 include:resend.com ~all` (or your SMTP relay provider)

### 2. DKIM (DomainKeys Identified Mail)
- Configure the CNAME / TXT keys provided by your mail provider (e.g. Resend or Mailcow) in your domain DNS zone.

### 3. DMARC
- **Type**: `TXT`
- **Host**: `_dmarc`
- **Value**: `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@your-domain.com`
