# 25: API: accept and decline

- GET /api/invitations/accept-info?token=... returns only the email domain and organization name, and whether an account exists for that email. It must not reveal the full email to an unauthenticated caller beyond what the accept page needs; mask the local part (for example j***@acme.com). Invalid tokens return the same generic response as expired.
- POST /api/invitations/accept with body { token }. Uses the session from the cookie. Calls acceptInvitation.
- POST /api/invitations/decline with body { token }. Marks declined only if the invite is pending (add declined status if prompt 07 did not include it; update the status rules and tests).

Rate limit both endpoints (prompt 28).
