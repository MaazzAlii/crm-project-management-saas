-- =============================================================================
-- Migration 0035: Invitations Table
-- Prompt 05: Invitations table migration
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on organization_id + status
CREATE INDEX IF NOT EXISTS idx_invitations_org_status 
    ON public.invitations(organization_id, status);

-- Unique partial index on (organization_id, email) where status = 'pending'
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_org_email_pending 
    ON public.invitations(organization_id, email) 
    WHERE status = 'pending';

-- Trigger to update updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_invitations_updated_at'
        ) THEN
            CREATE TRIGGER update_invitations_updated_at
                BEFORE UPDATE ON public.invitations
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;
