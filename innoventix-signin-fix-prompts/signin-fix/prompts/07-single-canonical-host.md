# 07: One canonical host

The site loads on www.project-manager.calara.agency and project-manager.calara.agency. Cookies set on one host are not sent to the other, which can cause logged-out loops.

1. Choose the canonical host: project-manager.calara.agency (no www), unless I say otherwise.
2. Add a permanent redirect from www to the canonical host in middleware.ts (or the Coolify proxy config, if that is where it belongs; say which).
3. Confirm NEXT_PUBLIC_APP_URL and APP_PUBLIC_URL both use the canonical host.
4. Confirm the cookies are set without a Domain attribute, so they belong to exactly one host.

Test: GET https://www.project-manager.calara.agency/login returns 301 to https://project-manager.calara.agency/login.
