# 04: Coolify environment variables (innoventix-app)

Set these in Coolify. Do not commit them. Values in angle brackets are yours to fill.

## App
NODE_ENV=production
APP_PUBLIC_URL=https://project-manager.calara.agency
NEXT_PUBLIC_APP_URL=https://project-manager.calara.agency
COOKIE_SECURE=true
DATABASE_URL=<Coolify postgres URL with the rotated password>
JWT_SECRET=<openssl rand -hex 32>
REFRESH_TOKEN_SECRET=<openssl rand -hex 32>
ENCRYPTION_SECRET=<openssl rand -hex 32>

## Email (temporary: Resend SMTP; switch to Mailcow later by changing SMTP_* only)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_REQUIRE_TLS=true
SMTP_USER=resend
SMTP_PASSWORD=<Resend API key, starts re_>
EMAIL_FROM_ADDRESS=invites@innoventixhub.tech
EMAIL_FROM_NAME=Innoventix
EMAIL_REPLY_TO=support@innoventixhub.tech

## Stripe (test mode)
STRIPE_SECRET_KEY=<sk_test_...>
STRIPE_WEBHOOK_SECRET=<whsec_... from the Stripe test webhook endpoint>
STRIPE_PRO_PRICE_ID=<price_... of the test product>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<pk_test_...>  -> only if the code reads it. Check with:
  grep -rn "NEXT_PUBLIC_STRIPE" app components lib
If nothing prints, leave it out. The hosted Checkout flow does not need it.

## Remove from Coolify
- ADMIN_PASSWORD (after the admin account exists, remove it)
- Any DEV_* variable
- RESEND_API_KEY (not used by the app anymore)
- Any variable not listed above that you do not recognize: ask before deleting

## Stripe webhook in test mode
Stripe Dashboard (test mode) -> Developers -> Webhooks -> Add endpoint:
URL: https://project-manager.calara.agency/api/stripe/webhook
Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
Copy the signing secret into STRIPE_WEBHOOK_SECRET.

## Stripe Billing Portal
Stripe Dashboard (test mode) -> Settings -> Billing -> Customer portal -> turn it on. Otherwise "Manage subscription" fails.

## Publishable key later
When the company provides live keys, repeat this list with sk_live_, pk_live_, a live webhook endpoint, and a live price ID. Do not mix test and live values.
