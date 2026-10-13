-- Migration 0045: Add temp_password_hash and require_password_change to invitations and users
-- Supports direct password creation during invite and first-login password change enforcement

ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS temp_password_hash TEXT NULL;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN NOT NULL DEFAULT false;
