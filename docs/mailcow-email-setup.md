# Mailcow Email Setup & Administrator Runbook

This guide details the steps required for the company administrator to configure, verify, and monitor Mailcow SMTP for transactional platform emails (such as team invitations, email verification, and workspace notifications).

---

## 1. Mailcow Mailbox Provisioning
1. Log in to the Mailcow Admin UI on your Contabo server:
   - **URL**: `https://mail.innoventixhub.tech/admin/mailbox`
2. Navigate to **Configuration** > **Mailboxes**.
3. Create the dedicated platform application mailbox:
   - **Email Address**: `invites@innoventixhub.tech`
   - **Support Address**: `support@innoventixhub.tech`
   - **Display Name**: `Innoventix Platform`
   - **Password**: Generate a high-entropy 32+ character random password.
4. Lifetime Super Admin accounts with unrestricted platform access:
   - `innoventixhub@gmail.com`
   - `maazalisshahid@gmail.com`
5. Save the credentials in production `.env.local` / Coolify environment variables:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=mail.innoventixhub.tech
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_REQUIRE_TLS=true
   SMTP_USER=invites@innoventixhub.tech
   SMTP_PASSWORD="<GENERATED_MAILBOX_PASSWORD>"
   EMAIL_FROM="Innoventix <invites@innoventixhub.tech>"
   EMAIL_FROM_ADDRESS=invites@innoventixhub.tech
   EMAIL_FROM_NAME="Innoventix"
   EMAIL_REPLY_TO=support@innoventixhub.tech
   APP_PUBLIC_URL=https://project-manager.calara.agency
   ```

---

## 2. DKIM Key Generation
1. In Mailcow, navigate to **Configuration** > **ARC/DKIM**.
2. Select your sending domain: `innoventixhub.tech`.
3. Set **Key size**: `2048` bits.
4. Set **Selector**: `dkim` (or `mailcow`).
5. Click **Generate** and copy the resulting public key record.

---

## 3. DNS Configuration for Sending Domain (`innoventixhub.tech`)
Publish the following DNS records at your DNS provider (e.g. Cloudflare, Route53, Namecheap):

### A. SPF (Sender Policy Framework)
Add or update the TXT record on the root domain (`innoventixhub.tech`):
```text
Type: TXT
Name: @
Value: v=spf1 mx a:mail.innoventixhub.tech -all
```

### B. DKIM (DomainKeys Identified Mail)
Add the TXT record for the selector generated in Step 2:
```text
Type: TXT
Name: dkim._domainkey
Value: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

### C. DMARC (Domain-based Message Authentication)
Add the TXT record for `_dmarc`:
```text
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@innoventixhub.tech; ruf=mailto:dmarc@innoventixhub.tech; sp=none; aspf=r; adkim=r
```
*Note: Start in monitoring mode (`p=none`). Transition to quarantine (`p=quarantine`) or reject (`p=reject`) after verifying zero legitimate email drops.*

---

## 4. Firewall & Connectivity Verification
Verify that outbound TCP traffic on port `587` is open from the Coolify application container to Mailcow:
```bash
# Test connectivity from application server / container:
nc -zv mail.innoventix.io 587
# Or via curl:
curl -v telnet://mail.innoventix.io:587
```

---

## 5. Send Test Message via CLI Script
Innoventix provides a dedicated test utility to verify SMTP credentials and deliverability without touching the web UI:

```bash
npx tsx scripts/send-test-email.ts <admin-destination@example.com>
```

### Script Behavior:
- Dispatches a single multipart email (HTML + Plain-Text).
- Uses strict TLS certificate validation (`rejectUnauthorized: true`).
- Logs the returned SMTP `messageId` on success.
- Formats typed error codes without ever leaking the password.

---

## 6. Inbox & Header Deliverability Inspection
1. Send test messages to both a **Gmail** and an **Outlook/Office 365** mailbox:
   ```bash
   npx tsx scripts/send-test-email.ts your.name@gmail.com
   npx tsx scripts/send-test-email.ts your.name@outlook.com
   ```
2. In Gmail, open the message > Click three dots (More) > **Show original**:
   - Check **SPF**: `PASS` with IP of Mailcow server.
   - Check **DKIM**: `PASS` with domain `innoventix.io`.
   - Check **DMARC**: `PASS`.
3. In Outlook, view Message Source and confirm the same `Authentication-Results` headers.
4. Verify the email lands in the Primary inbox, NOT the Spam / Junk folder.

---

## 7. Deliverability Scoring at mail-tester.com
1. Visit [mail-tester.com](https://www.mail-tester.com) to get a unique sink email address (e.g. `test-xxxx@srv1.mail-tester.com`).
2. Dispatch a test message:
   ```bash
   npx tsx scripts/send-test-email.ts test-xxxx@srv1.mail-tester.com
   ```
3. Check score on mail-tester.com.
4. **Target score**: **9.5/10 or 10/10** before opening user invitations to external parties.
