# Production Deployment Checklist

## Pre-Deployment (48 hours before)

- [ ] All code merged to main branch
- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migrations tested on staging
- [ ] Load testing completed (5000+ concurrent users)
- [ ] Security audit passed
- [ ] Backup procedures verified
- [ ] Rollback plan documented and tested

## Deployment Day

### 1. Final Verification (1 hour before)
- [ ] SSH access to Contabo server confirmed
- [ ] Staging environment fully tested
- [ ] Team on standby for monitoring
- [ ] Slack notifications configured

### 2. Deployment (Production Cutover)
- [ ] Stop old application (if exists)
- [ ] Push Docker image to registry
- [ ] Pull image on production server
- [ ] Run database migrations
- [ ] Start new application containers
- [ ] Verify health check endpoint: https://project-manager.calara.agency/api/health
- [ ] Test critical user flows (login, create org, CRM operations)

### 3. Post-Deployment (2 hours)
- [ ] Monitor error rates (should be < 1%)
- [ ] Monitor API latency (should be < 200ms p95)
- [ ] Monitor database connections (should be stable)
- [ ] Check backup jobs ran successfully
- [ ] Verify monitoring/alerting is active

### 4. Validation (24 hours)
- [ ] All users can log in
- [ ] Data integrity verified
- [ ] No duplicate records
- [ ] Email notifications working
- [ ] n8n automation webhooks firing
- [ ] Stripe webhooks processing correctly
- [ ] All audit logs created
- [ ] Performance metrics baseline established

## Rollback Procedure (if issues occur)

1. Restore previous database backup
2. Rollback Docker image to previous version
3. Restart application containers
4. Verify health check and critical flows
5. Notify team and users

## Post-Rollback

- [ ] Investigate root cause
- [ ] Fix issue on development
- [ ] Re-test thoroughly
- [ ] Schedule new deployment
