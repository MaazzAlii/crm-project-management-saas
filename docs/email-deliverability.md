# Transactional Email Deliverability Guide

This checklist details the DNS records and validation practices required for the primary sending domain (`EMAIL_FROM_ADDRESS`, e.g. `innoventix.io`).

> **Note for Company Administrator**: AI Coding Agents do not configure production DNS records. The administrator must publish these records directly in the company's DNS dashboard (e.g. Cloudflare, AWS Route53).

---

## 1. SPF (Sender Policy Framework) Record
An SPF record lists all servers authorized to send email on behalf of your domain.

- **Record Type**: `TXT`
- **Host**: `@` (or the specific subdomain if sending from e.g. `mail.innoventix.io`)
- **Value**:
  ```text
  v=spf1 mx a:mail.innoventix.io -all
  ```
- **Rule**: If you utilize multiple mail relays (e.g. Google Workspace alongside Mailcow), combine them within a single TXT record:
  ```text
  v=spf1 mx a:mail.innoventix.io include:_spf.google.com -all
  ```
- **Failure Policy**: Avoid `~all` (softfail) once testing is complete; use `-all` (hardfail) to prevent spoofing.

---

## 2. DKIM (DomainKeys Identified Mail) Record
DKIM attaches a cryptographic signature to every outgoing email, verified by receiving mail servers against your published public key.

- **Record Type**: `TXT`
- **Host / Selector**: `<selector>._domainkey` (e.g. `dkim._domainkey` or `mailcow._domainkey`)
- **Value**:
  ```text
  v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
  ```
- **Key Length**: Always use a 2048-bit RSA key.
- **Provider Alignment**: The DKIM key must be generated in the Mailcow admin UI (**Configuration** > **ARC/DKIM**) for the sending domain.

---

## 3. DMARC (Domain-based Message Authentication, Reporting & Conformance)
DMARC protects domain reputation by instructing receivers how to handle emails that fail SPF or DKIM.

- **Record Type**: `TXT`
- **Host**: `_dmarc`
- **Starting Value (Monitoring Mode)**:
  ```text
  v=DMARC1; p=none; rua=mailto:dmarc-reports@innoventix.io; ruf=mailto:dmarc-reports@innoventix.io; sp=none; aspf=r; adkim=r
  ```
- **Gradual Enforcement**:
  1. **Phase 1 (Monitoring)**: `p=none` for 2–4 weeks while inspecting XML aggregate reports sent to `rua`.
  2. **Phase 2 (Quarantine)**: `p=quarantine; pct=25` graduating to `pct=100` once legitimate senders are confirmed.
  3. **Phase 3 (Rejection)**: `p=reject` for total protection against domain spoofing.

---

## 4. Human-Monitored Reply-To Address
Transactional emails that bounce or receive user inquiries must never lead to a dead end.

- **Default Reply-To**: Set `EMAIL_REPLY_TO=support@innoventix.io` to a shared inbox monitored by support team members.
- **Inviter Override**: When an organization member has a verified email (`email_verified = true`), platform invitation emails route replies directly to that inviter. If unverified, the system falls back safely to `EMAIL_REPLY_TO`.

---

## 5. End-to-End Verification Checklist

| Step | Action | Success Criteria |
| :--- | :--- | :--- |
| **1. CLI Delivery Test** | Run `npx tsx scripts/send-test-email.ts <dest>` | Exits with `0` and returns SMTP `messageId` |
| **2. Gmail Inspection** | Send to personal `@gmail.com` address | Primary Inbox placement; "Show Original" confirms `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS` |
| **3. Outlook Inspection** | Send to personal `@outlook.com` address | Focused Inbox placement; Message source shows `Authentication-Results: ... dkim=pass header.i=@innoventix.io` |
| **4. Spam Score Benchmark** | Send to [mail-tester.com](https://www.mail-tester.com) | Score **9.0 / 10** or higher |
| **5. Reverse DNS (PTR)** | Contabo VPS reverse DNS check | Reverse PTR for the Mailcow IP resolves to `mail.innoventix.io` |
