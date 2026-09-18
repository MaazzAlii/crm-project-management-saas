-- Migration 0025: In-App Notifications Enhancements & Compatibility View
-- Provides backwards-compatible 'notifications' view over 'in_app_notifications' and creates performance indices

CREATE OR REPLACE VIEW public.notifications AS
SELECT * FROM public.in_app_notifications;

CREATE INDEX IF NOT EXISTS idx_in_app_notifs_org_created 
ON public.in_app_notifications(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_in_app_notifs_unread 
ON public.in_app_notifications(organization_id, read_at) 
WHERE read_at IS NULL;
