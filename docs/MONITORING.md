# Vibely Monitoring Guide

## Health Checks

### Backend Health Endpoint
```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-27T...",
  "uptime": 12345,
  "environment": "production"
}
```

### Monitoring Checklist
- [ ] Backend health endpoint responding
- [ ] Database connections healthy
- [ ] Redis connections healthy
- [ ] WebSocket connections active
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%
- [ ] Disk space > 20% free

## Metrics to Track

### Application Metrics
- Request latency (p50, p95, p99)
- Error rate by endpoint
- Authentication success/failure rate
- Matchmaking queue length
- Active WebSocket connections
- Call success/failure rate
- Payment success/failure rate

### Database Metrics
- Connection pool usage
- Query latency
- Slow queries (>100ms)
- Deadlocks
- Table bloat

### Redis Metrics
- Memory usage
- Hit rate
- Connected clients
- Key evictions

### Business Metrics
- Daily active users
- New registrations
- Matches created
- Calls completed
- Messages sent
- Gifts sent
- Revenue (coins purchased)

## Alerting

### Critical Alerts (Immediate Response)
- Backend health check failing
- Database connection failures
- Redis connection failures
- Error rate > 5%
- Call failure rate > 10%

### Warning Alerts (Investigate)
- Memory usage > 80%
- CPU usage > 70%
- Disk space < 20%
- Slow query rate increasing
- Rate limit violations spike

## Logging

### Log Levels
- `ERROR`: Failures requiring immediate attention
- `WARN`: Potential issues, degraded performance
- `INFO`: Normal operations, key events
- `DEBUG`: Detailed diagnostic information

### What to Log
- Authentication attempts (success/failure)
- Authorization failures
- Payment events
- Moderation actions
- Admin actions
- WebRTC signaling errors
- Rate limit violations

### What NOT to Log
- Passwords or password hashes
- JWT tokens or refresh tokens
- Payment secrets or API keys
- Call media (audio/video)
- Private user messages
- Sensitive PII

## Backup Strategy

### PostgreSQL Backups
```bash
# Daily full backup
pg_dump -U vibely vibely > backup_$(date +%Y%m%d).sql

# Weekly compressed backup
pg_dump -U vibely vibely | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Backup Verification
- Test restore monthly
- Verify backup file integrity
- Monitor backup job completion
- Store backups in separate location

### Recovery Procedures
1. Stop backend service
2. Restore database from backup
3. Clear Redis cache (if needed)
4. Restart backend service
5. Verify health checks pass
6. Monitor for errors

## Disaster Recovery

### Recovery Time Objective (RTO)
- Target: < 1 hour for full service restoration
- Database restore: < 30 minutes
- Service restart: < 5 minutes

### Recovery Point Objective (RPO)
- Target: < 24 hours data loss
- Daily backups with 24-hour retention
- Transaction logs for point-in-time recovery

### Failover Procedures
1. Detect service failure via health checks
2. Notify on-call team
3. Switch to backup infrastructure (if available)
4. Restore from latest backup
5. Verify service functionality
6. Communicate status to users
