# 18: Invitation service: create

Create lib/services/invitation-service.ts function createInvitation(session, input):

Input: email, role.
Steps in order:
1. Require an authenticated session. No session returns unauthorized.
2. Only owner or admin may invite. Member and viewer get forbidden.
3. Admin cannot invite another admin or owner. Only owner can invite admin.
4. Normalize and validate the email (prompt 16).
5. If the email already belongs to a member of this organization, return a clear error: already a member.
6. If a pending invite exists for this email, return it with a flag "alreadyPending" (do not create a second one).
7. Check seats: countSeatsUsed + 1 must not exceed the plan's maxMembers. If it does, return LIMIT_REACHED with the plan name and the limit.
8. Check maxPendingInvites.
9. Generate token, store hash, expires_at now plus 7 days, write audit event.
10. Send the email (prompt 29). If sending fails, keep the invite row with a send_failed flag and return a warning, not an error.

Tests for each numbered step, including cross-organization isolation.
