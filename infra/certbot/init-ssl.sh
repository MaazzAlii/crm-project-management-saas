#!/bin/bash
# =============================================================================
# Innoventix Platform v2 — Automated Let's Encrypt SSL Bootstrap & Renewal
# =============================================================================

set -e

DOMAINS=("app.innoventixhub.com" "api.innoventixhub.com")
EMAIL="${CERTBOT_EMAIL:-admin@innoventixhub.com}"
STAGING="${CERTBOT_STAGING:-0}" # Set to 1 for testing against Let's Encrypt Staging API

echo "🔒 Starting SSL Certificate Initialization for: ${DOMAINS[*]}..."

# Construct domain flags
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

# Select staging vs production endpoint
STAGING_ARG=""
if [ "$STAGING" != "0" ]; then
  STAGING_ARG="--staging"
  echo "⚠️ Using Let's Encrypt Staging Environment."
fi

# Run Certbot in standalone/webroot mode
certbot certonly --webroot \
  -w /var/www/certbot \
  $DOMAIN_ARGS \
  --email "$EMAIL" \
  --rsa-key-size 4096 \
  --agree-tos \
  --force-renewal \
  --non-interactive \
  $STAGING_ARG

echo "✅ SSL certificates obtained successfully!"
echo "🔄 Reloading Nginx..."
docker exec innoventix-nginx nginx -s reload || true
