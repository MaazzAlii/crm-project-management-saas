# 19: Invitation service: resend and revoke

- resendInvitation(session, inviteId): owner or admin. Allowed states from prompt 07. Creates a new token; the old hash is replaced so the old link stops working. Resets expiry. Writes invite.resent.
- revokeInvitation(session, inviteId): owner or admin. Only pending invites. Sets revoked_at and status. The link stops working immediately. Writes invite.revoked.

Tests: old link fails after resend; revoked link fails; a member cannot revoke; another organization's invite returns not found.
