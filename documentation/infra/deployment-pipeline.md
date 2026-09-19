# CI/CD Deployment Pipeline — Contabo VPS

## 1. Overview

This document specifies the architecture, operation, and configuration of the automated CI/CD deployment pipeline for the self-hosted **Innoventix Platform v2** on the **Contabo Cloud VPS**.

The pipeline replaces third-party managed platform workflows (such as Netlify/Vercel) with an automated, containerized GitHub Actions pipeline targeting self-hosted infrastructure.

```
+-------------------------------------------------------------------------+
|                           GitHub Actions                                |
|                                                                         |
|  [Push to main / workflow_dispatch]                                     |
|           │                                                             |
|           ▼                                                             |
|  +-------------------+     +--------------------+     +--------------+  |
|  |   1. Validate     | ──> | 2. Build & Push    | ──> |  3. Deploy   |  |
|  | - type-check      |     | - Multi-stage OCI  |     | - SSH Action |  |
|  | - unit/integ tests|     | - Push to GHCR     |     | - Zero-dt/   |  |
|  | - Next.js build   |     |   (ghcr.io)        |     |   Rollback   |  |
|  +-------------------+     +--------------------+     +-------┬------+  |
+---------------------------------------------------------------│---------+
                                                                │ SSH
                                                                ▼
                                                +─────────────────────────+
                                                |       Contabo VPS       |
                                                |                         |
                                                |  Nginx Reverse Proxy    |
                                                |  (app.innoventixhub.com)|
                                                |           │             |
                                                |           ▼             |
                                                |  Docker: innoventix-app |
                                                |  (Port 3000 /api/health)|
                                                +─────────────────────────+
```

---

## 2. GitHub Repository Secrets Required

To enable automated deployment, add the following secrets in **GitHub Repository Settings** → **Secrets and variables** → **Actions** → **Repository secrets**:

| Secret Name | Description | Example / Format |
| :--- | :--- | :--- |
| `CONTABO_HOST` | Public IP address or hostname of your Contabo VPS | `161.97.xxx.xxx` or `vps.innoventixhub.com` |
| `CONTABO_USER` | Dedicated SSH user on the VPS (must be in `docker` group) | `deploy` |
| `CONTABO_SSH_KEY` | Private SSH key corresponding to public key in `authorized_keys` | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `CONTABO_SSH_PORT` | SSH port on Contabo VPS (optional, defaults to `22`) | `22` or `2222` |

> [!IMPORTANT]
> The `GITHUB_TOKEN` secret is automatically provided by GitHub Actions with `packages: write` permissions to publish container images to GitHub Container Registry (`ghcr.io`). You do not need to manually configure registry tokens.

### Generating a Dedicated Deploy Key Pair
On your local machine or VPS:
```bash
# Generate dedicated Ed25519 deploy key
ssh-keygen -t ed25519 -C "github-actions-deploy@innoventixhub.com" -f ~/.ssh/innoventix_deploy_key

# Copy public key to Contabo VPS
ssh-copy-id -i ~/.ssh/innoventix_deploy_key.pub deploy@<CONTABO_HOST>

# Paste the private key into GitHub Settings > Secrets > CONTABO_SSH_KEY
cat ~/.ssh/innoventix_deploy_key
```

---

## 3. Server Setup on Contabo VPS

Ensure the Contabo VPS is configured with the expected directories and files:

```bash
# 1. Create directory structure
sudo mkdir -p /opt/innoventix/app /opt/innoventix/supabase

# 2. Assign ownership to deploy user
sudo chown -R deploy:deploy /opt/innoventix

# 3. Add deploy user to docker group
sudo usermod -aG docker deploy

# 4. Copy docker-compose.app.yml to VPS
# (This file is tracked in git and copied to /opt/innoventix/app/)
cp docker-compose.app.yml /opt/innoventix/app/docker-compose.app.yml

# 5. Ensure .env.production exists with chmod 600
ls -l /opt/innoventix/app/.env.production
# Output must show: -rw------- 1 deploy deploy ...
```

---

## 4. Pipeline Stages & Execution

The workflow is defined in [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml) and consists of three stages:

### Stage 1: Validation (Fail-Fast)
1. **`npm run type-check`**: Runs `tsc --noEmit` to verify type integrity across all application routes, components, and tests.
2. **`npm run test`**: Runs the Vitest test suite (80+ unit and integration tests covering security, RLS, audit immutability, webhooks, and billing).
3. **`npm run build`**: Runs Next.js production build to verify that all pages, static routes, and dynamic handlers compile cleanly.

### Stage 2: Containerization & Registry Push
1. Uses multi-stage [`Dockerfile`](file:///Dockerfile) with `node:20-alpine`.
2. Leverages Next.js `output: 'standalone'` to reduce image size from ~1.2GB down to ~160MB.
3. Automatically tags images:
   - `latest` (on push to `main`)
   - `sha-<commit-sha>` (unique immutable commit hash)
   - `staging` (when triggered via staging workflow)
4. Pushes image to GitHub Container Registry: `ghcr.io/<owner>/<repo>:<tag>`.

### Stage 3: VPS Deployment & Rollback Strategy
1. **Pulls Image First**: The new image is pulled to the VPS *before* stopping the existing container.
2. **Identifies Previous Version**: Inspects `innoventix-app` to record `PREV_IMAGE`.
3. **Recreates Container**: Starts the new container using `docker compose up -d app`.
4. **Post-Deploy Health Check**: Probes `http://127.0.0.1:3000/api/health` up to 15 times (every 3 seconds).
5. **Automatic Rollback**:
   - If `/api/health` returns HTTP 200 with `{"status":"ok"}`, deployment is marked successful and dangling images are pruned.
   - If health check fails after 45 seconds, the pipeline immediately rolls back to `PREV_IMAGE`, restarts the previous container, and exits with code 1.

---

## 5. Deployment Strategies & Downtime Window

### Current Deployment Model: Fast In-Place Swap
- Pre-pulling the image before container restart reduces downtime to **under 1–2 seconds**.
- Nginx reverse proxy buffers incoming requests during the brief container switch.

### True Zero-Downtime Blue/Green Architecture (Optional Upgrade)
For environments requiring absolute zero downtime:
1. Run two container instances: `innoventix-app-blue` (port 3000) and `innoventix-app-green` (port 3001).
2. Deploy new image to the idle color.
3. Verify `/api/health` on the idle color.
4. Update Nginx upstream block to route traffic to the newly verified color:
   ```nginx
   upstream app_backend {
       server 127.0.0.1:3001; # Swapped from 3000
   }
   ```
5. Reload Nginx configuration without dropping connections: `sudo nginx -s reload`.

---

## 6. Staging Deployments

The workflow supports manual deployment to an isolated staging environment on the same VPS:

1. In GitHub, go to **Actions** → **CI/CD Pipeline** → **Run workflow**.
2. Select target environment: `staging`.
3. The pipeline deploys `innoventix-app-staging` running on **port 3005** with its own environment file (`.env.staging`).
4. Staging can be verified by running the Playwright E2E suite against `http://<CONTABO_HOST>:3005` or staging subdomain before promoting code to `main`.
