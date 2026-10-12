-- =============================================================================
-- Migration 0040: Invitation Declined Status
-- Adds 'declined' status to invitations table check constraint and adds declined_at timestamp
-- Written idempotently to safely run across migrations
-- =============================================================================

ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_status_check;

ALTER TABLE public.invitations 
    ADD CONSTRAINT invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired', 'declined'));

ALTER TABLE public.invitations 
    ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
