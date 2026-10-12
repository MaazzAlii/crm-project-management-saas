# 03: Sign In calls only the login endpoint

Test first (write it and show it failing):
- Rendering the login page and submitting valid credentials must make exactly one request to /api/auth/login and zero requests to any verify-email route.
- Clicking Sign In on the landing page must navigate to /login without any request to verify-email.

Then fix:
- Remove any automatic call to verify-email/send from the login page, the landing page, the sign-in button, or any layout that runs on those pages.
- Keep verify-email/send only in the email verification banner, where the user clicks a button to request an email.
- On success, the login page sets the cookies (already done by the login route) and then navigates with window.location.assign(redirectTo) or router.replace plus router.refresh.

Show the test output before and after. Do not change the rate limit values in this prompt.
