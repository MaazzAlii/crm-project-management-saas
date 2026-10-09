-- TASK Security Hardening: Row Level Security & Privilege Revocation on Auth Tables
-- Resolves potential data exposure in Supabase / PostgREST environments where public tables default to anon/authenticated grants.
-- Tables: users, refresh_tokens, sessions, auth_tokens

-- 1. Enable Row Level Security (Deny-by-default for all non-superuser / non-bypassrls roles)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.auth_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all access from anon and authenticated roles if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON public.users, public.refresh_tokens, public.sessions, public.auth_tokens FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON public.users, public.refresh_tokens, public.sessions, public.auth_tokens FROM authenticated;
    END IF;
END $$;
