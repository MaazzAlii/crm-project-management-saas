# 08: Email verification table

Create table email_verifications:
- id uuid primary key
- user_id uuid not null references users on delete cascade
- email text not null (the address being verified)
- token_hash text not null unique
- expires_at timestamptz not null (24 hours)
- consumed_at timestamptz
- created_at timestamptz default now()

Index on user_id. Idempotent migration. Add the TypeScript type.

Also add users.email_verified_at timestamptz (nullable). Existing users with a password must be backfilled to verified, because they were created before this feature. Show the backfill query in the migration and test it on a copy of the local data.
