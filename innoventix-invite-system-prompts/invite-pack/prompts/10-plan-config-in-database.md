# 10: Store each organization's plan in the database

Create table organization_plans (or reuse the existing subscription table if it already has a plan column; state which you chose in your report):
- organization_id uuid primary key references organizations on delete cascade
- plan_id text not null default 'free', check in ('free','pro','enterprise')
- status text not null default 'active', check in ('active','past_due','canceled')
- stripe_customer_id text nullable
- stripe_subscription_id text nullable
- current_period_end timestamptz nullable
- updated_at timestamptz default now()

Backfill every existing organization to free. A new organization is created with free in the same transaction as the organization.

Test: a new organization has a free plan row; a deleted organization removes its plan row.
