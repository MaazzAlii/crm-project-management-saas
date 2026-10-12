-- =============================================================================
-- Migration 0042: Add send_failed column to invitations table
-- =============================================================================
-- Marks invitations where email dispatch failed, allowing the owner/admin
-- to view a warning and resend without background retries.
-- =============================================================================

ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS send_failed BOOLEAN NOT NULL DEFAULT false;

-- Create index for quick filtering of failed invites if needed
CREATE INDEX IF NOT EXISTS idx_invitations_send_failed ON invitations(organization_id, send_failed);
