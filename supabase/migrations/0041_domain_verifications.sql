-- =============================================================================
-- Migration 0041: Domain Verifications Table
-- Prompt 26: Domain email verification codes and confirmation
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.domain_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    target_email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_verifications_org_domain 
    ON public.domain_verifications(organization_id, domain);
