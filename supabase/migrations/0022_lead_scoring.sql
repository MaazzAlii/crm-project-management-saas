-- Migration 0022: Add AI Lead Scoring fields to clients table
-- Tracks calculated qualification score (0-100), timestamp, and multi-factor breakdown

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),
ADD COLUMN IF NOT EXISTS lead_score_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lead_score_breakdown JSONB DEFAULT '{}'::jsonb;

-- Index for lead scoring analytics and pipeline filtering
CREATE INDEX IF NOT EXISTS idx_clients_org_lead_score ON public.clients(organization_id, lead_score);
