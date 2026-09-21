# DNS Record Setup & Let's Encrypt SSL Automated Renewal

## Overview
This document specifies the DNS configuration, Nginx reverse proxy topology, and Let's Encrypt SSL certificate issuance/renewal procedure for the Contabo VPS.

---

## 1. DNS A Record Configuration

Point all required subdomains to your Contabo VPS Public IPv4 Address (`<VPS_PUBLIC_IP>`):

| Subdomain Host | Type | Target IP | Description |
| :--- | :--- | :--- | :--- |
| `app.innoventixhub.com` | `A` | `<VPS_PUBLIC_IP>` | Next.js Frontend Application Shell |
| `api.innoventixhub.com` | `A` | `<VPS_PUBLIC_IP>` | Self-Hosted Supabase Gateway (Kong API) |
| `maaz.n8n.calara.agency` | `A` | `<VPS_PUBLIC_IP>` | n8n Automation Engine |

---

## 2. Let's Encrypt Certificate Issuance

Run Certbot on the Contabo VPS to obtain TLS certificates:

```bash
# 1. Install Certbot & Nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Issue SSL certificates for all 3 subdomains
sudo certbot --nginx \
  -d app.innoventixhub.com \
  -d api.innoventixhub.com \
  -d maaz.n8n.calara.agency \
  --non-interactive \
  --agree-tos \
  -m admin@innoventixhub.com
```

---

## 3. SSL Auto-Renewal Verification

Let's Encrypt certificates expire every 90 days. Certbot automatically registers a systemd timer (`certbot.timer`) for auto-renewal.

Verify timer and test dry-run:
```bash
# Check status of certbot systemd timer
sudo systemctl status certbot.timer

# Test auto-renewal dry run
sudo certbot renew --dry-run
```

---

## 4. Nginx Reload & Health Check Commands

```bash
# Test Nginx syntax
sudo nginx -t

# Reload Nginx configuration without downtime
sudo systemctl reload nginx

# Check listening SSL sockets
sudo ss -tulpn | grep ':443'
```
