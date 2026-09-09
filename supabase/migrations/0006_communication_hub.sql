-- TASK 10 Migration 6: Communication Hub Channels & Messages Tables

-- Communication Provider Enum
CREATE TYPE public.communication_provider AS ENUM (
    'slack',
    'whatsapp',
    'email',
    'discord',
    'upwork'
);

-- Message Direction Enum
CREATE TYPE public.message_direction AS ENUM (
    'inbound',
    'outbound'
);

-- Communication Channels Table
CREATE TABLE IF NOT EXISTS public.communication_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider public.communication_provider NOT NULL,
    external_account_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, provider, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_organization_id ON public.communication_channels(organization_id);

CREATE TRIGGER update_communication_channels_updated_at
    BEFORE UPDATE ON public.communication_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages Table (Unified Inbox Data Layer)
CREATE TABLE IF NOT EXISTS public.communication_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Nullable for unmatched inbox messages
    direction public.message_direction NOT NULL,
    sender_name VARCHAR(255),
    sender_identifier VARCHAR(255), -- email / phone / slack user id
    body TEXT NOT NULL,
    external_message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON public.communication_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.communication_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON public.communication_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.communication_messages(sent_at DESC);

CREATE TRIGGER update_communication_messages_updated_at
    BEFORE UPDATE ON public.communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
