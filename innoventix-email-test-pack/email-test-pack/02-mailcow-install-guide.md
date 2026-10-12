# 02: Install Mailcow for company mailboxes (later)

## Read this first: port conflict
Mailcow uses ports 80 and 443 for its web admin. Coolify's proxy on the same server also uses 80 and 443. Both cannot run on one server without changes. Options:
- Option 1 (recommended): install Mailcow on a separate small VPS dedicated to mail.
- Option 2: keep Mailcow on the Contabo server and move Coolify's proxy to other ports. This is risky and can break the live site.
Do not install on the current production server until this is decided.

## Other requirements
- At least 6 GB RAM (Mailcow docs recommend this).
- Outbound port 25 open. Contabo often blocks port 25 by default; request an unblock from Contabo support.
- Inbound ports open: 25, 80, 143, 443, 465, 587, 993, 995, 110, 4190.
- Reverse DNS (PTR) for the server IP set to mail.innoventixhub.tech in the Contabo panel. Without it, Gmail will reject or spam your mail.
- A new IP with no mail history sends poorly for the first weeks. This is the main reason transactional invites should stay on Resend.

## Install steps (on the mail server, not the app server)
1. DNS: create an A record mail.innoventixhub.tech pointing to the server IP.
2. Install Docker and Docker Compose.
3. git clone https://github.com/mailcow/mailcow-dockerized
4. cd mailcow-dockerized && ./generate_config.sh
   - Enter the hostname mail.innoventixhub.tech and your timezone.
5. docker compose pull && docker compose up -d
6. Open https://mail.innoventixhub.tech/admin and log in with the default admin login from the Mailcow docs. Change it immediately.
7. Configuration -> Domains -> add innoventixhub.tech.
8. Configuration -> Mailboxes -> add invites@innoventixhub.tech and support@innoventixhub.tech. Use generated passwords and store them in a password manager.
9. Configuration -> ARC/DKIM keys -> generate a 2048-bit key for innoventixhub.tech. Copy the TXT record.
10. DNS for innoventixhub.tech:
    - MX: mail.innoventixhub.tech, priority 10
    - SPF (TXT on @): v=spf1 mx -all   (or ~all while testing)
    - DKIM (TXT on dkim._domainkey): the value from step 9
    - DMARC (TXT on _dmarc): v=DMARC1; p=none; rua=mailto:support@innoventixhub.tech
11. Test with: npx tsx scripts/send-test-email.ts you@gmail.com using SMTP_HOST=mail.innoventixhub.tech, SMTP_PORT=587, SMTP_SECURE=false, SMTP_USER=invites@innoventixhub.tech.
12. Check the result at mail-tester.com and aim for 9/10 or higher.

## Mailbox login
- Webmail: https://mail.innoventixhub.tech/SOGo
- Admin: https://mail.innoventixhub.tech/admin/mailbox (for mailbox management only)
- Mailboxes are for humans to read replies. The app only sends.
