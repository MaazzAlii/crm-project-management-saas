-- Migration 0013: Add sales pipeline fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS deal_value NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS lost_reason TEXT,
ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for fast kanban board queries by tenant organization
CREATE INDEX IF NOT EXISTS idx_clients_org_pipeline_stage ON clients(organization_id, pipeline_stage);
