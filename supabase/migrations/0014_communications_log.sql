-- Migration 0014: CRM Client Communications Log (Manual & Auto-Synced Messages)

-- Make channel_id nullable for manual logging without pre-configured channels
ALTER TABLE public.communication_messages ALTER COLUMN channel_id DROP NOT NULL;

-- Add channel_type to specify provider or manual channel (whatsapp, email, sms, call, note, meeting, slack, discord, etc.)
ALTER TABLE public.communication_messages ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) DEFAULT 'email';

-- Add optional subject line for emails/notes/meetings
ALTER TABLE public.communication_messages ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- Add flag to distinguish manually logged entries from webhook/auto-synced ones
ALTER TABLE public.communication_messages ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- Add index for querying client communication history quickly
CREATE INDEX IF NOT EXISTS idx_messages_client_sent ON public.communication_messages(client_id, sent_at DESC);
