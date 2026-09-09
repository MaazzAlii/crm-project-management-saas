# TASK 10 — Core Database Schema — Communication Hub & Billing

## Objective
Create communication_channels, messages, subscription_plans, and organization_subscriptions tables.

## Why This Task Exists
Backbone for the unified inbox and for billing external organizations.

## Dependencies
- TASK 09

## Current State
No communication/billing tables exist yet.

## Files To Inspect
- supabase/migrations/0001..0005

## Files To Create
- supabase/migrations/0006_communication_hub.sql
- supabase/migrations/0007_billing_subscriptions.sql

## Files To Modify


## Implementation Instructions
- communication_channels: id, organization_id, provider (slack/whatsapp/email/discord/upwork), external_account_id, status, connected_at.
- messages: id, organization_id, channel_id, client_id (nullable), direction, sender, body, external_message_id, sent_at, read_at.
- subscription_plans: id, name, price_monthly, price_yearly, feature_limits (jsonb, including ai_features_enabled flag).
- organization_subscriptions: id, organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Never store raw provider credentials in plaintext (see TASK 62).

## Testing Requirements
- Seed 3 plans and one active subscription for the test org.

## Acceptance Criteria
- [ ] All tables created, organization-scoped, feature_limits shape documented.

## Git Commit
Recommended commit:

`feat(db): add communication hub and billing schema`

## Verification
- Confirm messages.client_id can be null (general inbox) and non-null (matched).

## Next Task
`TASK 11`
