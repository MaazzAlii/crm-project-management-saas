# 28: Rate limits for invite and verification endpoints

Use the existing rate limit helper if there is one; otherwise add a small interface with an in-memory store and a clear note that it resets on restart.

Limits:
- invitation create: 20 per hour per user
- resend: 5 per hour per invitation
- accept and decline: 30 per hour per IP
- verification send: 1 per 60 seconds per user
- domain code send: 3 per hour per organization

Return 429 with a Retry-After header. Tests for each limit.
