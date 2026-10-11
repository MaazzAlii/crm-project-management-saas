# 20: Invitation service: accept

acceptInvitation(rawToken, currentSession or null):

1. Hash the token and find the invitation. Not found returns invalid (same message as expired, so attackers cannot tell which case it is).
2. Check status: revoked, expired, or accepted returns the matching message.
3. If there is no session: return needsAccount with the invitation email, so the UI can show signup or login with the email locked.
4. If a session exists: the session's user email must equal the invitation email (case-insensitive). Mismatch returns wrongAccount.
5. Add the user to the organization with the invited role. In one transaction: insert member, mark invitation accepted with accepted_by.
6. If the user is already a member: mark the invite accepted and return success without creating a duplicate.
7. Write invite.accepted.

Tests: one-time use (second accept fails), wrong account, expired, revoked, and concurrent double-accept creates exactly one membership.
