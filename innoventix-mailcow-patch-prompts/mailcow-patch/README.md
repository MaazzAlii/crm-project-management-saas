# Mailcow Email Patch (apply on top of the current invite work)

Decision: invitation emails are sent by the app through the company Mailcow SMTP server on Contabo. Resend is not used. n8n is not used for invites.

## Why this setup
- Invitations come from a platform address on the company domain, such as noreply@company-domain. Never from a personal Gmail, and never from the owner's own mailbox.
- The app sends directly over SMTP. Nothing else sits in the middle, so there is one fewer service to run and one fewer place secrets live.
- The sender name shows who invited the person (for example "Maaz Ali via Innoventix"), so people know why they got the email, while the From address stays the platform's.

## Which original prompts this replaces
| Original prompt | Status | Replaced by |
|---|---|---|
| 04-email-provider-setup | Replaced | P1-mailcow-smtp-setup |
| 29-email-provider-abstraction | Partly replaced (SMTP only, no Resend implementation) | P2-invite-sender-identity |
| 33-deliverability-checklist | Replaced | P3-mailcow-deliverability-tests |
| (any Resend code already written) | Remove | P4-remove-resend-and-cleanup |

All other prompts (05 to 28, 30 to 32, 34 to 56) stay as they are.

## Order
1. P4 first if Antigravity already added Resend code.
2. P1, then P2, then P3.
3. Then return to the original plan at the step Antigravity was on.

## What you need from the company (not from me)
- A mailbox on the Mailcow server for the app, for example noreply@company-domain, with its own password (not your personal login).
- Confirm that outbound port 587 is open from the Coolify server to the Mailcow server.
- Confirm the DNS records for the sending domain: SPF, DKIM (from Mailcow), and DMARC.
