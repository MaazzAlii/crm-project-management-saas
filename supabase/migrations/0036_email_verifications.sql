-- =============================================================================
-- Migration 0036: Email Verifications Table & User Backfill
-- Prompt 08: Email verification table
-- =============================================================================

-- 1. Create table email_verifications
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user_id
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id
    ON public.email_verifications(user_id);

-- 2. Add email_verified_at column to users table
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 3. Backfill existing users who have a password to verified
UPDATE public.users 
SET 
    email_verified_at = COALESCE(created_at, NOW()),
    email_verified = TRUE
WHERE 
    email_verified_at IS NULL 
    AND password_hash IS NOT NULL;
