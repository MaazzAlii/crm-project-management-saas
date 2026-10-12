# Mailcow Email Setup & Administrator Runbook

This guide details the steps required for the company administrator to configure, verify, and monitor Mailcow SMTP for transactional platform emails (such as team invitations, email verification, and workspace notifications).

---

## 1. Mailcow Mailbox Provisioning
1. Log in to the Mailcow UI at your Contabo server (e.g. `https://mail.innoventix.io`).
2. Navigate to **Configuration** > **Mailboxes**.
3. Create the dedicated platform application mailbox:
   - **Email Address**: `invites@innoventix.io` (or `noreply@innoventix.io`)
   - **Display Name**: `Innoventix Platform`
   - **Password**: Generate a high-entropy 32+ character random password.
4. Save the credentials securely in the production `.env.local` / Coolify environment variables:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=mail.innoventix.io
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=invites@innoventix.io
   SMTP_PASS="<GENERATED_PASSWORD>"
   EMAIL_FROM_ADDRESS=invites@innoventix.io
   EMAIL_FROM_NAME="Innoventix"
   EMAIL_REPLY_TO=support@innoventix.io
   APP_PUBLIC_URL=https://app.innoventix.io
   ```

---

## 2. DKIM Key Generation
1. In Mailcow, navigate to **Configuration** > **ARC/DKIM**.
2. Select your sending domain (e.g. `innoventix.io`).
3. Set **Key size**: `2048` bits.
4. Set **Selector**: `dkim` (or `mailcow`).
5. Click **Generate** and copy the resulting public key record.

---

## 3. DNS Configuration for Sending Domain
Publish the following DNS records at your DNS provider (e.g. Cloudflare, Route53, Namecheap):

### A. SPF (Sender Policy Framework)
Add or update the TXT record on the root domain (`innoventix.io`):
```text
Type: TXT
Name: @
Value: v=spf1 mx a:mail.innoventix.io -all
```
*(If other authorized senders exist, include them, e.g. `include:_spf.google.com`)*

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
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@innoventix.io; ruf=mailto:dmarc-reports@innoventix.io; sp=none; aspf=r; adkim=r
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
