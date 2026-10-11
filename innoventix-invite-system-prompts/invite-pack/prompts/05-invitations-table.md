# 05: Invitations table migration

Add migration for table invitations:
- id uuid primary key
- organization_id uuid not null references organizations on delete cascade
- email text not null (stored lowercase, trimmed)
- role text not null, check in ('admin','member','viewer') (owner is never invitable)
- token_hash text not null unique (SHA-256 of the raw token)
- status text not null default 'pending', check in ('pending','accepted','revoked','expired')
- invited_by uuid references users on delete set null
- expires_at timestamptz not null
- accepted_at timestamptz, accepted_by uuid references users on delete set null
- revoked_at timestamptz
- created_at, updated_at timestamptz default now()

Indexes: organization_id plus status; unique partial index on (organization_id, email) where status = 'pending'.

Migration must be idempotent. Add the TypeScript type. Run it on the local database and show the table definition.
