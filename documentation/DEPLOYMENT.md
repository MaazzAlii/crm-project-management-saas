# Production Deployment Guide

## Prerequisites

- SSH access to Contabo server
- Docker and Docker Compose installed on server
- Domain DNS configured to point to server IP
- SSL certificate ready (Let's Encrypt)
- Environment variables prepared

## Deployment Steps

### 1. Prepare Environment on Server

```bash
ssh root@contabo-server

# Create application directory
mkdir -p /opt/innoventix
cd /opt/innoventix

# Create .env file with production secrets
nano .env.production

# Copy Nginx config
mkdir -p /etc/nginx/sites-available
cp nginx/nginx.conf /etc/nginx/sites-available/innoventix

# Enable Nginx site
ln -s /etc/nginx/sites-available/innoventix /etc/nginx/sites-enabled/

# Create backup directory
mkdir -p /backups
chmod 755 /backups
```

### 2. Build and Deploy

```bash
# Clone repository
git clone https://github.com/MaazzAlii/crm-project-management-saas.git
cd crm-project-management-saas

# Checkout main branch
git checkout main
git pull origin main

# Build Docker image
docker build -t innoventix:latest .

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify containers running
docker ps

# Check health
curl -k https://project-manager.calara.agency/api/health
```

### 3. Setup Backups

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Configure cron
bash scripts/cron-setup.sh

# Run first backup manually
./scripts/backup.sh
```

### 4. Setup Monitoring

```bash
# Install Prometheus (if not using managed service)
docker run -d --name prometheus \
  -p 9090:9090 \
  -v /opt/innoventix/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Verify metrics endpoint
curl http://localhost:9090/metrics
```

### 5. Verify Deployment

```bash
# Check application logs
docker logs -f innoventix-app

# Check database connection
docker exec innoventix-db psql -U innoventix_app -d innoventix -c "SELECT 1;"

# Test API endpoints
curl -X POST https://project-manager.calara.agency/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker logs innoventix-app

# Verify environment variables
docker inspect innoventix-app | grep -A 20 "Env"

# Check database connectivity
docker exec innoventix-app npm run db:status
```

### Database connection issues

```bash
# Connect to database directly
docker exec innoventix-db psql -U innoventix_app -d innoventix

# Check connection pool
SELECT count(*) FROM pg_stat_activity;

# Restart PgBouncer
docker restart innoventix-pgbouncer
```

### High disk usage

```bash
# Check backup sizes
du -sh /backups/*

# Clean old backups manually
find /backups -name "backup_*.sql.gz" -mtime +14 -delete
```

## Monitoring

### Key Metrics to Watch

1. **API Response Time**: Should be < 200ms (p95)
2. **Error Rate**: Should be < 1%
3. **Database Connections**: Should stay < 50 (of 100 max)
4. **CPU Usage**: Should stay < 40%
5. **Memory Usage**: Should stay < 70% of 12GB

### Access Monitoring

- Prometheus: http://server-ip:9090
- Grafana: http://server-ip:3000 (if installed)
- Logs: `docker logs -f innoventix-app`

## Maintenance

### Weekly Tasks

- [ ] Review error logs
- [ ] Verify backups completed
- [ ] Check disk space
- [ ] Monitor performance trends

### Monthly Tasks

- [ ] Update Docker images
- [ ] Review security logs
- [ ] Test backup restoration
- [ ] Capacity planning review
