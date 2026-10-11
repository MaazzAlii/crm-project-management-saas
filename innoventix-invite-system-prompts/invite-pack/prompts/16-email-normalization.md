# 16: Email normalization and validation

Create lib/validation/email.ts:
- normalizeEmail(input): trims, lowercases, and removes surrounding quotes.
- isValidEmail(email): practical check, length up to 254, one @, a domain with a dot.
- Reject addresses with spaces or control characters.

Tests: "  Boss@Example.COM " becomes "boss@example.com"; plus a set of invalid inputs (empty, no domain, spaces, two @ signs, unicode control characters).
