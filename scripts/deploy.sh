#!/bin/bash
# =============================================================================
# Innoventix Platform v2 — Production Deployment & Health Verification
# Orchestrates git sync, migrations, container restarts, and health checks
# =============================================================================

set -e

echo "🚀 Starting Innoventix Production Deployment Pipeline..."

# 1. Environment Verification
if [ ! -f ".env.production" ]; then
  echo "❌ Error: .env.production file missing. Aborting deployment."
  exit 1
fi

# 2. Pre-flight Git Check
echo "📥 Checking git status..."
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "🔄 Pulling latest changes from origin/main..."
  git pull origin main
fi

# 3. Apply Database Migrations
echo "🗄️ Running pending database migrations..."
npx ts-node scripts/run-migrations.ts

# 4. Build and Restart Docker Stack
echo "🐳 Building and spinning up production containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# 5. Wait for Application Warmup & Health Probe
echo "⏳ Waiting for application health check probe..."
MAX_RETRIES=15
COUNT=0
HEALTH_URL="http://127.0.0.1:3000/api/health"

until curl -s "$HEALTH_URL" | grep -q '"status":"healthy"' || [ $COUNT -eq $MAX_RETRIES ]; do
  sleep 2
  COUNT=$((COUNT + 1))
  echo "   Waiting for app to become healthy... ($COUNT/$MAX_RETRIES)"
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Deployment health check failed! Inspect logs via: docker compose -f docker-compose.prod.yml logs"
  exit 1
fi

echo "✅ Production deployment completed successfully and healthy!"
