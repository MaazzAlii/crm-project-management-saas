-- =============================================================================
-- Migration 0040: Add 'declined' status to invitations table
-- Prompt 25: Support invitation decline action
-- =============================================================================

ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_status_check;

ALTER TABLE public.invitations 
    ADD CONSTRAINT invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired', 'declined'));

ALTER TABLE public.invitations 
    ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
