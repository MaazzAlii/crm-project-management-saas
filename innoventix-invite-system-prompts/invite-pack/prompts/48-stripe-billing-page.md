# 48: Billing page

Settings > Billing shows:
- Current plan and status
- Usage card from prompt 40
- Upgrade to Pro, or Manage subscription (Stripe Billing Portal, test mode) when a customer exists
- Recent invoices from Stripe for this organization only (if none, empty state)

Create the Billing Portal session on the server with the organization's own customer ID.

Test: a free org sees Upgrade; a pro org sees Manage.
