# 26: API: email verification and domain code

- POST /api/auth/verify-email/send: for the logged-in user. Creates a verification row (prompt 14), sends the email, invalidates older codes. Rate limited to one send per 60 seconds per user.
- POST /api/auth/verify-email/confirm: body { token }. Consumes the row atomically, sets users.email_verified_at.
- POST /api/organizations/domain/send-code: owner only. Sends a code to an address at the claimed domain. The code is a link and a 6-digit code stored hashed.
- POST /api/organizations/domain/confirm: owner only. Sets verified_domain and domain_verified_at.

Tests: code is one-time, expires, cannot be used by another user, and a member cannot claim a domain.
