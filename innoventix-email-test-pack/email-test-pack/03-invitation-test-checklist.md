# 03: Invitation test checklist

## Part 1: Local (fast, no real email needed)
Use EMAIL_PROVIDER=console in .env.local. The invite link prints in the server log.
1. npm run dev (port 3000).
2. Log in as the owner of a test organization (use a fresh signup, not the admin account).
3. Open Team -> Invite Member. Enter maazalisshahid+invite1@gmail.com, role member.
4. The invite appears in Pending with status Pending.
5. Copy the link from the server log.
6. Open the link in a private window. Expect the accept page showing the organization name.
7. Sign up with that exact email. Expect the email field to be locked.
8. Accept. You are redirected to the dashboard in the invited organization.
9. Back in the owner window: reload Team. The new member appears once, and the pending row is gone.
10. Try the same link again: expect a clear "already used" or "invalid" message, not a crash.
11. Create a second invite, then revoke it. Its link must stop working.

Record for each step: pass, fail, or not built. Any "not built" goes back to Antigravity.

## Part 2: Resend email (real delivery)
Repeat steps 3 to 10 with EMAIL_PROVIDER=smtp and Resend settings from 01.
- Step 4 must also show no warning badge "Send failed".
- Step 5 becomes: open the email in your inbox and click the button.
- If no email arrives, check:
  a. Resend dashboard -> Logs (shows whether the message was accepted)
  b. Server log for a line starting with [email]
  c. Database: invitations row send_failed should be false

## Part 3: Live (only after deploy)
1. https://project-manager.calara.agency/settings/team -> Invite works, no 404.
2. Dashboard -> Invite Team -> dialog opens.
3. https://project-manager.calara.agency/team?action=invite -> redirects to the team page, not a 404.
4. Invite a test address, accept in a private window.
5. Stripe test checkout with card 4242 4242 4242 4242 (test keys only).

## Things still not verified (do not claim them as working)
- Email delivery to real inboxes (Part 2 has not been run).
- Playwright invite-full-flow (has not passed in a real run).
- Live site behavior after the latest pushes.
- Stripe webhook on the live URL.
