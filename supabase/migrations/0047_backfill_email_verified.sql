-- =============================================================================
-- Migration 0047: Backfill email_verified for existing accounts
-- Status: PROPOSAL — NOT YET APPLIED (Awaiting user approval before execution)
-- =============================================================================

-- Existing users registered prior to email verification enforcement should have
-- their email status marked as verified so they do not see the verification banner
-- unexpectedly for accounts created before this release.

UPDATE public.users
SET email_verified = true,
    email_verified_at = NOW(),
    updated_at = NOW()
WHERE created_at < NOW()
  AND email_verified = false;
