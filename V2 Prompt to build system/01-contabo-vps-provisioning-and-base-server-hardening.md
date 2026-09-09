# TASK 01 — Contabo VPS Provisioning & Base Server Hardening

## Objective
Prepare the Contabo VPS as the single home for the entire platform: app, database, automation, and reverse proxy.

## Why This Task Exists
The platform must run entirely on infrastructure you control, not third-party managed services. This task establishes the secure base every later container/service sits on.

## Dependencies
- None — first task.

## Current State
Contabo VPS already exists and already runs n8n; nothing else is provisioned yet.

## Files To Inspect
- Existing n8n setup/config on the VPS (do not disrupt it)

## Files To Create
- documentation/infra/server-setup.md
- scripts/infra/harden.sh

## Files To Modify


## Implementation Instructions
- Inventory what's already running on the VPS (n8n, any existing services) before touching anything — never assume it's empty.
- Update OS packages, configure a firewall (ufw) allowing only required ports (22, 80, 443, and n8n's existing port).
- Create a non-root deploy user with SSH-key-only access; disable root SSH login and password auth.
- Install Docker and Docker Compose (the runtime for every self-hosted service that follows).
- Document the final server inventory (services, ports, users) in documentation/infra/server-setup.md.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- SSH key-only access, firewall default-deny, no root login — treat this as the security foundation for everything else.

## Testing Requirements
- Confirm SSH access works only via key for the deploy user.
- Confirm existing n8n instance still runs unaffected after hardening.

## Acceptance Criteria
- [ ] Firewall active with minimal open ports.
- [ ] Root SSH login disabled.
- [ ] Docker + Compose installed and verified.
- [ ] Existing n8n service confirmed unaffected.

## Git Commit
Recommended commit:

`chore(infra): provision and harden Contabo VPS base server`

## Verification
- Attempt root SSH login and confirm it is rejected.
- Run `docker --version` and `docker compose version` to confirm install.

## Next Task
`TASK 02`
