# Transactional Email Setup & Configuration (Mailcow SMTP)

This guide details the configuration variables and DNS requirements for Innoventix team invitations and transactional email delivery using self-hosted Mailcow on Contabo VPS.

---

## 1. Environment Variables Reference

| Variable | Provider | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `EMAIL_PROVIDER` | All | Selects active transactional mail transport (`smtp` or `console`) | `smtp` (production) / `console` (dev) |
| `EMAIL_FROM_ADDRESS` | `smtp` | Platform sending mailbox address | `invites@innoventixhub.tech` |
| `EMAIL_FROM_NAME` | `smtp` | Sender platform name | `Innoventix` |
| `EMAIL_REPLY_TO` | `smtp` | Fallback support reply-to mailbox | `support@innoventixhub.tech` |
| `APP_PUBLIC_URL` | All | Base URL for invite links and verification callbacks | `https://project-manager.calara.agency` |
| `SMTP_HOST` | `smtp` | Mailcow SMTP server hostname | `mail.innoventixhub.tech` |
| `SMTP_PORT` | `smtp` | Outgoing SMTP server port | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_SECURE` | `smtp` | Secure connection flag | `false` (for 587 STARTTLS) |
| `SMTP_REQUIRE_TLS` | `smtp` | Strict TLS enforcement flag | `true` |
| `SMTP_USER` | `smtp` | SMTP mailbox account | `invites@innoventixhub.tech` |
| `SMTP_PASSWORD` | `smtp` | SMTP mailbox password (never committed) | `secret_mailbox_password` |

---

## 2. Environment Behavior & Safety Rules

- **Development (`NODE_ENV=development`)**:
  - `EMAIL_PROVIDER` can be set to `console`.
  - Invitation and verification emails (including raw activation links) print directly to server output logs.
- **Production (`NODE_ENV=production`)**:
  - `EMAIL_PROVIDER=console` is **strictly refused**. The application throws a startup validation error if `console` is selected or if credentials for `smtp` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) are missing.
  - In production, `EMAIL_PROVIDER` must always be `smtp`.

---

## 3. Sender Name & From Address Rule

- For team invitations, the sender display name shows the **inviter name** (e.g. `Maaz Ali via Innoventix`).
- The actual RFC From address **always remains the platform's domain** (`invites@innoventixhub.tech`).
- The Reply-To header routes to the inviter's email if verified, or falls back to `support@innoventixhub.tech`.
- This guarantees that outbound emails pass SPF and DKIM alignment checks regardless of tenant organization or user names.

---

## 4. DNS Configuration: SPF, DKIM, and DMARC

To guarantee deliverability and prevent emails from landing in spam or being rejected, configure the following DNS records for `innoventixhub.tech`:

### 1. SPF (Sender Policy Framework)
- **Type**: `TXT`
- **Host**: `@`
- **Value**: `v=spf1 include:mail.innoventixhub.tech ~all`

### 2. DKIM (DomainKeys Identified Mail)
- Configure the TXT record generated in Mailcow Admin UI (`https://mail.innoventixhub.tech/admin/mailbox` -> Routing & Domains -> ARC/DKIM).
- **Host**: `dkim._domainkey` (or selector specified in Mailcow)
- **Value**: `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...`

### 3. DMARC
- **Type**: `TXT`
- **Host**: `_dmarc`
- **Value**: `v=DMARC1; p=none; rua=mailto:support@innoventixhub.tech`
