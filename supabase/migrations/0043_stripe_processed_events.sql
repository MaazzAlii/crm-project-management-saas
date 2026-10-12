-- Migration 0043: Processed Stripe Events Table (Prompt 47)
-- Ensures idempotent webhook handling by deduplicating Stripe event IDs.

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_created ON public.stripe_processed_events(processed_at DESC);
