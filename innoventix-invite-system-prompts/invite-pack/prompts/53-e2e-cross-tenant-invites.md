# 53: Security: invitations across organizations

Tests:
- Org A owner cannot read, resend, or revoke Org B's invitation IDs (404).
- Org A owner cannot accept Org B's invitation by copying the link into Org A's session: the email must match, and the membership must be for the invited organization only.
- Org A member cannot invite (403) even if they call the API directly.
- Token from a revoked invite does not work after revoke.
- Invite tokens never appear in any API response except the one-time create response for the owner.
