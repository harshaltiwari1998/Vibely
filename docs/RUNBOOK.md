# Vibely Operational Runbook

## Common Issues & Solutions

### 1. Backend Won't Start

**Symptoms:**
- Backend container exits immediately
- Health check fails
- Port 4000 not responding

**Diagnosis:**
```bash
docker compose logs backend
docker compose exec backend npm run healthcheck
```

**Common Causes:**
- Database connection failure (check DATABASE_URL)
- Redis connection failure (check REDIS_URL)
- Missing environment variables
- Port already in use

**Resolution:**
```bash
# Verify environment variables
docker compose exec backend env

# Test database connection
docker compose exec postgres pg_isready

# Test Redis connection
docker compose exec redis redis-cli ping

# Restart backend
docker compose restart backend
```

### 2. WebSocket Connection Failures

**Symptoms:**
- Users cannot connect to real-time features
- Matchmaking not working
- Chat not updating in real-time

**Diagnosis:**
```bash
# Check Redis connection (WebSocket state stored in Redis)
docker compose exec redis redis-cli ping

# Check backend logs for WebSocket errors
docker compose logs backend | grep -i websocket
```

**Common Causes:**
- Redis connection lost
- JWT token expired/invalid
- CORS configuration incorrect
- Firewall blocking WebSocket connections

**Resolution:**
```bash
# Verify Redis is running
docker compose ps redis

# Check CORS configuration
docker compose exec backend env | grep CORS

# Restart backend to re-establish connections
docker compose restart backend
```

### 3. WebRTC Call Failures

**Symptoms:**
- Calls won't connect
- "ICE connection failed" error
- No video/audio

**Diagnosis:**
```bash
# Check TURN server connectivity
# Check WebRTC logs in browser console
# Verify STUN/TURN configuration
```

**Common Causes:**
- TURN server not configured or unreachable
- Firewall blocking UDP traffic
- STUN server timeout
- Symmetric NAT without TURN

**Resolution:**
```bash
# Verify TURN server is running
nc -zv your-turn-server.com 3478

# Check TURN credentials in environment
docker compose exec backend env | grep TURN

# Test with different network (mobile hotspot)
```

### 4. Database Connection Pool Exhaustion

**Symptoms:**
- "Too many connections" error
- Slow database queries
- Backend timeouts

**Diagnosis:**
```bash
# Check active connections
docker compose exec postgres psql -U vibely -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection limit
docker compose exec postgres psql -U vibely -c "SHOW max_connections;"
```

**Resolution:**
```bash
# Increase connection limit in postgresql.conf
# Or use PgBouncer for connection pooling
# Restart backend to release stale connections
docker compose restart backend
```

### 5. High Memory Usage

**Symptoms:**
- Backend process using > 2GB memory
- OOM kills
- Slow performance

**Diagnosis:**
```bash
docker compose stats
```

**Common Causes:**
- Memory leak in WebSocket connections
- Large file uploads in memory
- Too many concurrent connections

**Resolution:**
```bash
# Restart backend to clear memory
docker compose restart backend

# Scale backend horizontally
docker compose up -d --scale backend=3

# Add memory limits to docker-compose.yml
```

### 6. Payment Failures

**Symptoms:**
- Payments not processing
- Coin balance not updating
- Webhook failures

**Diagnosis:**
```bash
# Check payment logs
docker compose logs backend | grep -i payment

# Verify payment provider credentials
docker compose exec backend env | grep PAYMENT

# Check webhook endpoint accessibility
curl -X POST https://your-domain.com/api/payments/webhook -d "{}"
```

**Resolution:**
```bash
# Verify payment provider status
# Check webhook configuration in payment provider dashboard
# Ensure idempotency keys are unique
```

### 7. Push Notification Failures

**Symptoms:**
- Android notifications not received
- FCM token registration failing

**Diagnosis:**
```bash
# Check FCM logs
docker compose logs backend | grep -i fcm

# Verify FCM server key
docker compose exec backend env | grep PUSH
```

**Resolution:**
```bash
# Verify FCM server key is correct
# Check Firebase project configuration
# Ensure device tokens are valid
```

## Escalation Procedures

### Critical Issues (P0)
- Backend completely down
- Database inaccessible
- Payment system down
- Security breach suspected

**Action:** Immediate notification to on-call team, activate incident response

### High Priority (P1)
- WebRTC calls failing for majority of users
- WebSocket connections failing
- High error rate (>5%)

**Action:** Notify team within 15 minutes, begin investigation

### Medium Priority (P2)
- Slow performance
- Intermittent issues
- Non-critical features broken

**Action:** Investigate within 1 hour, fix in next deployment

### Low Priority (P3)
- UI bugs
- Minor UX issues
- Documentation updates

**Action:** Schedule in next sprint

## Backup & Restore

### Database Backup
```bash
# Manual backup
docker compose exec postgres pg_dump -U vibely vibely > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U vibely vibely < backup_20260827.sql
```

### Redis Backup
```bash
# Redis persists to disk automatically (AOF + RDB)
# To backup:
docker compose exec redis redis-cli BGSAVE
docker compose cp redis:/data/dump.rdb ./redis_backup.rdb
```

### Disaster Recovery
1. Stop all services: `docker compose down`
2. Restore database from backup
3. Clear Redis: `docker compose exec redis redis-cli FLUSHALL`
4. Restart services: `docker compose up -d`
5. Verify health checks: `curl http://localhost:4000/api/health`

## Contact Information

- **On-Call Engineer:** [Phone/Email]
- **DevOps Team:** [Email/Slack]
- **Security Team:** [Email/Slack]
- **Payment Provider Support:** [Contact]
- **TURN Server Provider:** [Contact]
- **Hosting Provider:** [Contact]
