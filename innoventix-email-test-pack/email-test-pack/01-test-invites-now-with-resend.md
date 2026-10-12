# 01: Test invitation emails now, using Resend SMTP (temporary)

Why: Mailcow is not installed yet. Resend gives you SMTP credentials, so the app can send through the existing SMTP code path without any code change.

## A. Create the Resend key
1. Sign up at resend.com with your company or personal account.
2. API Keys -> Create API Key -> Sending access -> copy the key (starts with re_). It is shown once.

## B. Quick test without a domain (sandbox)
- Sender must be onboarding@resend.dev.
- Resend only delivers to the email address of the Resend account itself.
- Use this only to confirm the key works.

## C. Real test with your domain (needed for invites to other people)
1. Resend -> Domains -> Add domain -> innoventixhub.tech.
2. Add the DNS records Resend shows (SPF, DKIM, and a bounce record) in the DNS panel where innoventixhub.tech is managed.
3. Wait until Resend shows Verified.
4. Sender becomes invites@innoventixhub.tech.

## D. Values for .env.local (local) and Coolify (production)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_REQUIRE_TLS=true
SMTP_USER=resend
SMTP_PASSWORD=<your re_ key>
EMAIL_FROM_ADDRESS=invites@innoventixhub.tech
EMAIL_FROM_NAME=Innoventix
EMAIL_REPLY_TO=support@innoventixhub.tech
APP_PUBLIC_URL=http://localhost:3000   (local)  /  https://project-manager.calara.agency (Coolify)

Port 587 also works with SMTP_PORT=587 and SMTP_SECURE=false.

## E. Send a test email
npx tsx scripts/send-test-email.ts you@gmail.com

Expected: a success line, and the message arrives within a minute. If it fails, copy the error type only (for example AUTH or TLS). Do not copy the password.

## F. Test address for invitations
Use Gmail plus addressing so one inbox receives several test invites:
- maazalisshahid+invite1@gmail.com
- maazalisshahid+invite2@gmail.com
Gmail delivers both to maazalisshahid@gmail.com. Use a new +alias for each test.

## G. Do not use Resend for the boss demo unless the domain is verified.
