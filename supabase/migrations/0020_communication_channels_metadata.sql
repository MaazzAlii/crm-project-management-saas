-- TASK 37 Migration 20: Add metadata column to communication_channels for credentials/configs

ALTER TABLE public.communication_channels
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
