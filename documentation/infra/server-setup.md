# Contabo VPS Server Inventory & Infrastructure Setup

## Overview
This document outlines the base server configuration, security hardening, user access rules, and service topology for the self-hosted Innoventix Platform on Contabo VPS.

---

## 1. Service Topology & Port Allocation

| Service | Container / Process | External Port | Internal / Proxy Destination | Protocol / Auth |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | `sshd` | `22` | Direct | SSH Key Only (Non-root `deploy`) |
| **HTTP** | `nginx` | `80` | Direct -> HTTPS Redirect | Open |
| **HTTPS** | `nginx` | `443` | SSL Termination | TLS 1.2 / TLS 1.3 |
| **n8n Automation** | `n8n` (Docker) | `5678` | `localhost:5678` | Basic Auth / Session Auth |
| **Next.js App** | `app` (Docker) | Internal | `localhost:3000` | App Session / Bearer |
| **Self-Hosted Supabase API** | `postgrest`/`gotrue` | Internal | `localhost:8000` | Supabase JWT / Anon / Service Key |
| **Supabase Postgres DB** | `db` (PostgreSQL) | Internal | `localhost:5432` | DB Role Auth (Isolated) |

---

## 2. Server Access & User Policy

- **Root Access**: Disabled over SSH (`PermitRootLogin no`).
- **Deploy User**: Non-root user `deploy` with `sudo` privileges.
- **Authentication**: Strict SSH key-based authentication only (`PasswordAuthentication no`).
- **Firewall Policy**: `ufw` default-deny incoming, default-allow outgoing. Only Ports `22`, `80`, `443`, and `5678` are open externally.

---

## 3. Pre-Installed Runtimes & Dependencies

- **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS
- **Container Engine**: Docker Engine (`>= 24.0.0`)
- **Orchestration**: Docker Compose v2 (`docker compose`)
- **Reverse Proxy**: Nginx with Let's Encrypt (Certbot)
- **Existing Services**: Co-located n8n container preserved on port 5678.

---

## 4. Maintenance & Health Verification Commands

- Check Docker status: `docker ps`
- Check firewall status: `sudo ufw status verbose`
- Check listening ports: `sudo ss -tulpn`
- Run hardening script: `bash scripts/infra/harden.sh`
