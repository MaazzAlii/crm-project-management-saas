-- TASK 09 Migration 4: Clients Table with Communication Mode Field

-- Communication Mode Enum (manual log vs auto-synced connected hub)
CREATE TYPE public.client_communication_mode AS ENUM (
    'manual',
    'connected'
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    platform VARCHAR(50) DEFAULT 'WhatsApp', -- WhatsApp/Slack/Upwork/Discord/Email/Other
    country VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_schedule VARCHAR(50) DEFAULT 'Per Project', -- Monthly/Weekly/Per Project
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    communication_mode public.client_communication_mode NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tenant isolation & lookup performance
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_communication_mode ON public.clients(communication_mode);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Service role access enabled, user RLS policies applied in Task 12)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
