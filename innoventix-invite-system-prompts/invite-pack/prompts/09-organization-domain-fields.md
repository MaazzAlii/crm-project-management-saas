# 09: Organization business-domain fields

Add to organizations:
- verified_domain text nullable (for example "acme.com")
- domain_verified_at timestamptz nullable

Rules:
- Only the owner can claim a domain.
- A domain is claimed by sending a verification code to an address at that domain (created in prompt 26). It is verified only after the code is accepted.
- A verified domain lets the organization show a verified badge. It does not block invites to other domains; invitees on other domains still work on all plans.

Add migration (idempotent), types, and a repository method to set and read the domain. Tests: a domain cannot be set by a non-owner.
