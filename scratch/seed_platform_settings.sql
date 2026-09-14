CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.platform_settings (key, value) VALUES
  ('global_feature_flags', '{"ai_kill_switch": false, "ai_reply_suggestions": true, "ai_lead_scoring": true, "ai_task_extraction": true, "ai_report_narratives": true}'),
  ('global_onboarding_defaults', '{"default_plan_tier": "starter", "trial_days": 14}')
ON CONFLICT (key) DO NOTHING;
