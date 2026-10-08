-- =============================================================================
-- Innoventix Platform v2 — Fix Foreign Keys from auth.users to public.users
-- =============================================================================

DO $$
BEGIN
  -- super_admins
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'super_admins_user_id_fkey') THEN
    ALTER TABLE public.super_admins DROP CONSTRAINT super_admins_user_id_fkey;
  END IF;
  ALTER TABLE public.super_admins ADD CONSTRAINT super_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'super_admins_granted_by_fkey') THEN
    ALTER TABLE public.super_admins DROP CONSTRAINT super_admins_granted_by_fkey;
  END IF;
  ALTER TABLE public.super_admins ADD CONSTRAINT super_admins_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id) ON DELETE SET NULL;

  -- profiles
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_id_fkey') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- ai_usage_log
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ai_usage_log_user_id_fkey') THEN
    ALTER TABLE public.ai_usage_log DROP CONSTRAINT ai_usage_log_user_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage_log') THEN
    ALTER TABLE public.ai_usage_log ADD CONSTRAINT ai_usage_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- client_users
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'client_users_user_id_fkey') THEN
    ALTER TABLE public.client_users DROP CONSTRAINT client_users_user_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_users') THEN
    ALTER TABLE public.client_users ADD CONSTRAINT client_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- audit_logs
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_actor_user_id_fkey') THEN
    ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_actor_user_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;
