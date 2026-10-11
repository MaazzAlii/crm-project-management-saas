# 15: Seat count repository

Add to the members repository:
- countMembers(orgId): counts organization_members rows.
- countSeatsUsed(orgId): members plus pending invites (both count against the limit).

Tests: removing a member frees a seat; accepting an invite moves it from pending to member without counting twice.
