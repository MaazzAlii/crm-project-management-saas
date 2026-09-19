-- TASK 34 Migration 19: In-App Notifications Table

CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- deadline_approaching, project_overdue, status_changed, milestone_completed
    title VARCHAR(255) NOT NULL,
    body TEXT,
    read_at TIMESTAMPTZ,
    related_entity_type VARCHAR(50), -- project, task
    related_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_user ON public.in_app_notifications(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.in_app_notifications(read_at);

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org notifications" ON public.in_app_notifications;
CREATE POLICY "Users can view org notifications"
    ON public.in_app_notifications FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert org notifications" ON public.in_app_notifications;
CREATE POLICY "Users can insert org notifications"
    ON public.in_app_notifications FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update org notifications" ON public.in_app_notifications;
CREATE POLICY "Users can update org notifications"
    ON public.in_app_notifications FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));
