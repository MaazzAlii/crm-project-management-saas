# 24: API: resend and revoke

- POST /api/invitations/[id]/resend
- POST /api/invitations/[id]/revoke

Both call the service functions from prompts 19. Return the updated invitation (no token). Cross-organization ids return 404.

Tests: owner resend 200, member 403, other organization 404, revoke then resend returns 409.
