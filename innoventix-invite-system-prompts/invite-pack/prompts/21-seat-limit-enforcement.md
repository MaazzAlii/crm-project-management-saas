# 21: Seat limit enforcement everywhere

Seats are checked in every path that can add a member, not only the invite form:
- invite creation (prompt 18)
- invite acceptance (prompt 20): if the org is full when the invitee accepts, refuse with a clear message to the owner's admins. Do not silently add the member.
- any direct member-add endpoint that already exists (remove it if it is not needed for invites, and list it in your report).

Tests: fill a free workspace to 3 seats, try a fourth invite (refused), revoke one, then invite again (allowed). Test accept refused when full.
