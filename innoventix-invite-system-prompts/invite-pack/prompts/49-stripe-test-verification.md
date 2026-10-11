# 49: Stripe test payment verification

Write scripts/verify-stripe-test.md with a step list, and a Playwright test that:
1. Logs in as the owner of a free test organization.
2. Goes to billing and clicks Upgrade to Pro.
3. On Stripe Checkout (test mode), enters card 4242 4242 4242 4242.
4. Returns to the app and waits for the plan to show Pro (webhook may take a few seconds; poll up to 30 seconds).
5. Checks the seat limit is now 15.
6. Checks the invite dialog allows a 4th seat.

Read the test account from environment variables only. Skip the test with a clear message if STRIPE_SECRET_KEY is not a test key.
