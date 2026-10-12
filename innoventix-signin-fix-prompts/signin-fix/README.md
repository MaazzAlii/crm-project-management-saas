# Sign-In Fix Pack

Problem seen on the live site (screenshots):
- Clicking Sign In sends a request that returns HTTP 429 with the message "Rate limit exceeded. Please wait 25 seconds before requesting another verification email." (code RATE_LIMIT_EXCEEDED).
- The raw JSON is displayed as the page at /login instead of an inline error.
- The landing page shows hardcoded numbers ($142,500 pipeline, +28.4% MRR, 14 active deals) that are not real data.
- The site loads on both www.project-manager.calara.agency and project-manager.calara.agency, which can split cookies.

Run in order. Step 01 changes no code.

| # | Prompt | Purpose |
|---|---|---|
| 01 | diagnose-signin-request | Find exactly which request Sign In sends and why |
| 02 | confirm-deployed-commit | Check that the live build matches the code being fixed |
| 03 | login-page-only-calls-login | Sign In must call only the login endpoint |
| 04 | no-raw-json-pages | API errors must never show as a browser page |
| 05 | rate-limit-policy | Sensible limits, friendly messages, retry countdown |
| 06 | landing-page-honest-content | Remove fake live numbers from the public landing page |
| 07 | single-canonical-host | One host for the site; cookies work everywhere |
| 08 | signin-e2e-tests | Browser test: landing → Sign In → dashboard, repeated |
| 09 | deploy-gate | Local checks, then wait for approval before any push |

Do not fix the 429 by turning rate limiting off. Fix the request that should not exist.
