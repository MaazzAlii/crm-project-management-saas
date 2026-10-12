# 08: Browser test for the full sign-in path

Write e2e/signin-landing-to-dashboard.spec.ts (Playwright):
1. Open the landing page. Click Sign In. Expect URL /login and a visible email field.
2. Enter the test owner's email and password from environment variables E2E_EMAIL and E2E_PASSWORD. Click Sign In.
3. Expect the dashboard URL and the dashboard heading.
4. Log out. Repeat steps 1 to 3 three times.
5. Record every network request in the test. Fail the test if any request goes to verify-email/send, or if any response body is shown as page text.
6. Wrong password: stays on /login, shows an inline message, does not show JSON.

Run with the local dev server, then against the staging URL if available. Paste the full output.
