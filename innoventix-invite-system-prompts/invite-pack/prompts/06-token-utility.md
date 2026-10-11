# 06: Secure token utility

Create lib/security/invite-token.ts:
- generateToken(): 32 random bytes, base64url string.
- hashToken(raw): SHA-256 hex.
- safeEqualHash(a, b): constant-time comparison.

Tests:
- Tokens are unique across 1,000 generations.
- hashToken is deterministic and never equals the raw token.
- Tokens contain only base64url characters.

Do not log tokens anywhere in the codebase. Add a test that a logger wrapper redacts any field named token.
