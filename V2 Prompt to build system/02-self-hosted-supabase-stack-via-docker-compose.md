# TASK 02 — Self-Hosted Supabase Stack via Docker Compose

## Objective
Stand up the full open-source Supabase stack (Postgres, GoTrue Auth, PostgREST, Realtime, Storage, Studio) on the VPS, replacing Supabase Cloud.

## Why This Task Exists
Self-hosting Supabase keeps every later task's schema/RLS/Auth work valid (same APIs, same Postgres, same RLS model) while satisfying the requirement that everything runs on your own Contabo server, not a third-party cloud.

## Dependencies
- TASK 01

## Current State
No database or auth service exists on the VPS yet.

## Files To Inspect
- documentation/infra/server-setup.md

## Files To Create
- docker-compose.supabase.yml
- documentation/infra/self-hosted-supabase.md
- .env.supabase.example

## Files To Modify


## Implementation Instructions
- Use Supabase's official self-hosting Docker Compose reference as the base, adapted to this VPS's resources.
- Configure Postgres with a persistent volume and scheduled local backups (detailed further in Task 04).
- Configure GoTrue (Auth), PostgREST (auto REST API), Realtime, and Storage services, all pointed at the same Postgres instance.
- Restrict Supabase Studio (the admin UI) to VPN/SSH-tunnel or IP-allowlist access only — never expose it publicly.
- Generate and securely store the service-role key, anon key, and JWT secret — these replace the Supabase-Cloud-issued equivalents everywhere else in the codebase.

## UI Requirements
- N/A — infra only.

## Backend Requirements
- This IS the backend data/auth layer for the whole platform going forward.

## Database Requirements
- No schema yet — this is the empty Postgres instance schema work begins on in TASK 07.

## API Requirements
- PostgREST auto-generates the REST API from the schema — no custom API code needed for basic CRUD.

## Security Requirements
- Studio never publicly reachable.
- JWT secret and service-role key stored only in the VPS's environment, never committed.

## Testing Requirements
- Verify Postgres, Auth, REST, Storage, and Realtime all respond correctly to basic health-check calls.

## Acceptance Criteria
- [ ] Full self-hosted Supabase stack running and healthy on the VPS.
- [ ] Studio confirmed unreachable from the public internet.
- [ ] All keys generated and securely recorded.

## Git Commit
Recommended commit:

`feat(infra): deploy self-hosted Supabase stack via Docker Compose`

## Verification
- curl each service's health endpoint from the VPS and confirm 200 responses.
- Attempt to reach Studio's port from outside the VPN/allowlist and confirm it is blocked.

## Next Task
`TASK 03`
