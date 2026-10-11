# 12: Audit events for invitations and verification

Use the existing audit log (lib/audit). Record these events with actor, organization_id, and target email (no tokens):
- invite.created, invite.resent, invite.revoked, invite.accepted, invite.expired (recorded when first seen expired)
- invite.declined (if a decline action exists)
- member.role_changed, member.removed
- email.verification_sent, email.verified
- domain.claimed, domain.verified

Tests: each action writes exactly one audit row, and the row contains no token or hash.
