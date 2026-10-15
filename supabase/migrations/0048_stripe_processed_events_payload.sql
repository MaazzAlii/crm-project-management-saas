-- Migration 0048: Add payload column to stripe_processed_events for webhook auditability
-- Option A: Reuses existing stripe_processed_events table (from migration 0043)
-- The table already has PRIMARY KEY (id) enforcing unique event deduplication.

ALTER TABLE public.stripe_processed_events 
ADD COLUMN IF NOT EXISTS payload JSONB;
