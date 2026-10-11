# P3: Mailcow deliverability and send tests (replaces prompt 33)

Code and documentation only. The DNS and Mailcow changes are done by the company admin, not by Antigravity.

Create docs/mailcow-email-setup.md with these steps for the admin:
1. In Mailcow, create the app mailbox noreply@company-domain. Use a generated password.
2. Enable DKIM for the domain in Mailcow and copy the public key.
3. DNS for the sending domain: SPF (include the Mailcow host), DKIM (from step 2), DMARC starting at p=none with a reporting address.
4. Confirm outbound port 587 from the Coolify server to the Mailcow host.
5. Send a test message with the app and check headers: SPF pass, DKIM pass, DMARC pass.
6. Send to a Gmail address and an Outlook address. Check the spam folder.
7. Score the sender at mail-tester.com. Target 9 out of 10 or better before the owner demo.

Code tasks:
- Add a script scripts/send-test-email.ts that sends one test message to an address passed on the command line. It reads SMTP settings from the environment and prints success or the typed error. It does not log the password.
- Add the script to docs.

Test: the script fails clearly when SMTP_HOST is unreachable (typed error, no stack trace shown to the caller).
