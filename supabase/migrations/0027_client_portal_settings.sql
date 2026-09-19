-- TASK 60 Migration 27: Client Portal Settings, Preferences & Team Visibility
-- Adds portal_settings JSONB column to clients table and establishes RLS policies for portal self-management.

-- 1. Add portal_settings column to clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS portal_settings JSONB DEFAULT '{
    "logo_url": null,
    "billing_email": null,
    "tax_id": null,
    "invoicing_preferences": {
        "require_po": false,
        "auto_receipt": true,
        "preferred_method": "stripe_card"
    },
    "notifications": {
        "new_project": true,
        "deadline_alerts": true,
        "deliverable_ready": true,
        "invoice_issued": true
    }
}'::jsonb;

-- 2. RLS: Allow Portal User to UPDATE their own client record
CREATE POLICY "Portal user can update own client settings"
    ON public.clients FOR UPDATE
    USING (
        id = public.get_portal_client_id()
        AND public.portal_plan_enabled()
    )
    WITH CHECK (
        id = public.get_portal_client_id()
        AND public.portal_plan_enabled()
    );

-- 3. RLS: Allow Portal User to SELECT client_users belonging to the same client_id (Team Tab)
CREATE POLICY "Portal user can view team members on same client"
    ON public.client_users FOR SELECT
    USING (
        client_id = public.get_portal_client_id()
        AND public.portal_plan_enabled()
    );
