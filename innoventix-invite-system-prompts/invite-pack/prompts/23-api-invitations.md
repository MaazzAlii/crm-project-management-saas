# 23: API: create and list invitations

Routes:
- GET /api/invitations: list for the session organization, filters: status, page size 25, cursor.
- POST /api/invitations: body { email, role }. Calls createInvitation. Returns 201 with the invitation (never the token), or 409 for alreadyMember, 402 for LIMIT_REACHED (use 402 with a structured error code), 403 for forbidden, 400 for invalid input.

Rules:
- organization_id comes only from the session.
- Validate bodies with a schema; reject unknown fields.
- Responses use the existing response shape.

Tests: 401 without session, 403 for member, 402 at limit, 201 for owner, and that the response body never contains a token or token_hash.
