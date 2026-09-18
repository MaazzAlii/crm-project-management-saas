-- Migration 0024: Add automation webhook fields to organizations
-- Enables tenant organizations to configure outbound n8n webhook targets and signing secrets

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS automation_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS automation_webhook_secret TEXT;

COMMENT ON COLUMN public.organizations.automation_webhook_url IS 'Outbound webhook URL for n8n or external automation engine on Contabo VPS.';
COMMENT ON COLUMN public.organizations.automation_webhook_secret IS 'HMAC-SHA256 signing secret for authenticating outbound automation payloads.';
