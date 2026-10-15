-- Migration 0049: Refresh token rotation tracking & family indexing
-- Essential for forensics, token family rotation, and reuse attack detection.
-- Must be applied to production before deploying AUTH-3.

ALTER TABLE public.refresh_tokens
  ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family
  ON public.refresh_tokens(token_family);
