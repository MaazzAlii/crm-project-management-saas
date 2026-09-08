# TASK 05 — Core Database Schema — Communication Hub & Billing

## Objective
Create the schema for the unified communication inbox and the subscription/billing tables that turn this into a sellable SaaS product.

## Why This Task Exists
These two additions are what distinguish the expanded platform from the original internal-only tool: (1) a multi-channel communication log per client, and (2) the billing model needed to charge external organizations a subscription.

## Dependencies
- TASK 04

## Current State
No communication or billing tables exist yet.

## Files To Inspect
- supabase/migrations/0001..0004

## Files To Create
- supabase/migrations/0005_communication_hub.sql
- supabase/migrations/0006_billing_subscriptions.sql

## Files To Modify


## Implementation Instructions
- Create `communication_channels` table: which external accounts (Slack workspace, WhatsApp Business number, email inbox) an organization has connected.
- Create `messages` table: unified inbox row per inbound/outbound message, linked to a channel, optionally to a client_id, with direction, sender, body, external_message_id, status.
- Create `subscription_plans` table: name (Starter/Pro/Agency), price, billing_interval, feature_limits (json: max_clients, max_team_members, communication channels included, etc).
- Create `organization_subscriptions` table: organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end.
- Design feature_limits as data, not code, so plans can change without redeploying.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- communication_channels: id, organization_id, provider (slack/whatsapp/email/discord/upwork), external_account_id, status, connected_at
- messages: id, organization_id, channel_id, client_id (nullable), direction (in/out), sender, body, external_message_id, sent_at, read_at
- subscription_plans: id, name, price_monthly, price_yearly, feature_limits (jsonb)
- organization_subscriptions: id, organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end

## API Requirements
- N/A

## Security Requirements
- Never store raw provider credentials (Slack/WhatsApp tokens) in plaintext — reference Task 44/45 for secrets handling.
- Stripe IDs only, never card data, touch this schema (PCI scope stays with Stripe).

## Testing Requirements
- Seed 3 subscription plans and one active organization_subscription for the test org.

## Acceptance Criteria
- [ ] All communication and billing tables exist and are organization-scoped.
- [ ] feature_limits json shape documented in architecture.md.

## Git Commit
Recommended commit:

`feat(db): add communication hub and subscription billing schema`

## Verification
- Confirm messages table can link to a client but also supports client_id null (general org inbox).

## Next Task
`TASK 06`
