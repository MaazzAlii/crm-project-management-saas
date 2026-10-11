# 14: Email verification repository

Create lib/db/repositories/email-verification-repo.ts:
- insertVerification(userId, email, tokenHash, expiresAt)
- findByTokenHash(hash)
- consume(id) sets consumed_at only if it is null (atomic)
- invalidateOlder(userId) marks older unconsumed rows consumed when a new code is sent

Tests: consume is one-time (second call returns false), and an expired row is refused by the service, not the repository.
