#!/usr/bin/env bash
#
# Harden Contabo VPS Base Server
# Usage: sudo bash scripts/infra/harden.sh [deploy_username]
#

set -euo pipefail

DEPLOY_USER="${1:-deploy}"

echo "======================================================"
echo " Starting Contabo VPS Base Server Hardening Routine"
echo " Target Deploy User: ${DEPLOY_USER}"
echo "======================================================"

# 1. Update OS Packages
echo "[1/6] Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git ufw fail2ban ca-certificates gnupg lsb-release

# 2. Configure Non-Root Deploy User
echo "[2/6] Configuring deploy user (${DEPLOY_USER})..."
if ! id "${DEPLOY_USER}" &>/dev/null; then
    useradd -m -s /bin/bash "${DEPLOY_USER}"
    usermod -aG sudo "${DEPLOY_USER}"
    echo "Created user ${DEPLOY_USER}."
fi

# Ensure SSH directory for deploy user
mkdir -p "/home/${DEPLOY_USER}/.ssh"
chmod 700 "/home/${DEPLOY_USER}/.ssh"
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/authorized_keys"
    chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
    echo "Copied root SSH authorized_keys to ${DEPLOY_USER}."
fi

# 3. Harden SSH Configuration
echo "[3/6] Hardening SSH daemon configuration..."
SSHD_CONFIG="/etc/ssh/sshd_config"
cp "${SSHD_CONFIG}" "${SSHD_CONFIG}.bak.$(date +%F_%T)"

sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "${SSHD_CONFIG}"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "${SSHD_CONFIG}"
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "${SSHD_CONFIG}"

systemctl restart ssh || systemctl restart sshd

# 4. Install Docker & Docker Compose v2
echo "[4/6] Installing Docker Engine & Docker Compose v2..."
if ! command -v docker &>/dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

usermod -aG docker "${DEPLOY_USER}" || true

# 5. Configure Firewall (UFW)
echo "[5/6] Configuring UFW Firewall rules..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 5678/tcp comment 'n8n Automation'
ufw --force enable

# 6. Check Existing Services (n8n preservation)
echo "[6/6] Checking existing services..."
if docker ps --format '{{.Names}}' | grep -q "n8n"; then
    echo "CONFIRMED: Existing n8n Docker container is running unaffected."
else
    echo "NOTICE: n8n container not detected in active docker ps list."
fi

echo "======================================================"
echo " Base Server Hardening Complete!"
echo " Docker: $(docker --version)"
echo " Compose: $(docker compose version)"
echo " Firewall Status:"
ufw status numbered
echo "======================================================"
