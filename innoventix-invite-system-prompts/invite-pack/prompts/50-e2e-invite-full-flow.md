# 50: End-to-end: invite and accept (two browsers)

Playwright test with two browser contexts:
1. Owner logs in, opens Team, invites a fresh address from E2E_INVITEE_EMAIL.
2. Invite appears in the pending list.
3. Invitee opens the invite link (read from the test email sink or the console log in test mode; do not hardcode).
4. Invitee signs up with the locked email and accepts.
5. Owner reloads: the invitee appears once as a member, and the pending row is gone.
6. Invitee sees the dashboard for the same organization.
7. Revoke a second invite; its link shows the generic invalid message.

Clean up test rows at the end, and list what was deleted.
