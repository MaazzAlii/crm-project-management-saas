# 07: Invitation status rules

Write lib/invitations/status.ts with pure functions (no database):
- computeStatus(invite, now): if accepted_at set returns accepted; if revoked_at set returns revoked; if expires_at < now returns expired; otherwise pending.
- canAccept(invite, now): only pending.
- canRevoke(invite): only pending.
- canResend(invite, now): pending or expired (expired resend creates a new token and new expiry; the old token stops working).

Expiry default: 7 days.

Tests cover every status transition and the boundary at exactly expires_at.
