-- Migration 0015: CRM Client Tags & Categorization System

-- Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT 'sky',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON public.tags(organization_id);

-- Add tags array column to clients table for direct query filtering
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Client Tags Junction Table
CREATE TABLE IF NOT EXISTS public.client_tags (
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (client_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_client_tags_tag_id ON public.client_tags(tag_id);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
