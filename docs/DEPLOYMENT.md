# Vibely Deployment Guide

**Repository:** https://github.com/harshaltiwari1998/Vibely

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Node.js 20+ (for building)
- PostgreSQL 16+ (if not using Docker)
- Redis 7+ (if not using Docker)
- SSL certificate (Let's Encrypt recommended)
- Domain name configured

## Quick Start with Docker

### 1. Clone Repository
```bash
git clone https://github.com/harshaltiwari1998/Vibely.git
cd vibely
```

### 2. Configure Environment
```bash
cp services/backend/.env.example services/backend/.env
# Edit services/backend/.env with your values
```

### 3. Generate JWT Secrets
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

### 4. Start Services
```bash
docker-compose up -d
```

### 5. Run Database Migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### 6. Seed Database (Optional)
```bash
docker-compose exec backend npm run seed
```

### 7. Verify Deployment
```bash
curl https://your-domain.com/api/health
```

## Manual Deployment

### Backend

```bash
cd services/backend
npm ci --only=production
npm run build
npm run start:prod
```

### Web

```bash
cd apps/web
npm ci
npm run build
# Serve dist/ folder with nginx or similar
```

## Environment Variables

See `services/backend/.env.example` for all required variables.

### Critical Production Variables
- `JWT_SECRET`: Strong random secret (32+ chars)
- `JWT_REFRESH_SECRET`: Different strong random secret
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CORS_ORIGIN`: Comma-separated allowed origins
- `TURN_SERVER_URL`: TURN server for WebRTC
- `PAYMENT_SECRET_KEY`: Payment provider secret

## SSL/TLS Configuration

### Using Let's Encrypt with Certbot
```bash
certbot --nginx -d vibely.app -d www.vibely.app
```

### Nginx Configuration
- TLS 1.3 enabled
- HTTP/2 enabled
- HSTS header set
- OCSP stapling enabled

## Scaling

### Horizontal Scaling
- Backend instances can be scaled behind load balancer
- Redis shared state for WebSocket connections
- Database connection pooling configured

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer recommended)
- Regular VACUUM and ANALYZE

## Monitoring

### Health Checks
```bash
# Backend health
curl https://your-domain.com/api/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

### Logs
```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# Nginx logs
docker-compose logs -f web
```

## Backup Strategy

### PostgreSQL
```bash
# Daily backup
docker-compose exec postgres pg_dump -U vibely vibely > backup.sql

# Restore
docker-compose exec -T postgres psql -U vibely vibely < backup.sql
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * cd /path/to/vibely && docker-compose exec -T postgres pg_dump -U vibely vibely > backups/vibely_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Backend Won't Start
- Check database connection: `docker-compose logs postgres`
- Check Redis connection: `docker-compose exec backend npm run healthcheck`
- Verify environment variables: `docker-compose exec backend env`

### WebSocket Issues
- Check Redis connection (WebSocket state stored in Redis)
- Verify CORS configuration
- Check firewall rules (port 4000)

### WebRTC Issues
- Verify TURN server credentials
- Check STUN/TURN reachability
- Verify firewall allows UDP traffic on TURN ports

## Performance Tuning

### PostgreSQL
- `shared_buffers`: 25% of RAM
- `work_mem`: 64MB
- `maintenance_work_mem`: 512MB
- `effective_cache_size`: 75% of RAM
- `max_connections`: 200

### Redis
- `maxmemory`: 2GB
- `maxmemory-policy`: allkeys-lru
- `save`: 900 1, 300 10, 60 10000

### Node.js
- `NODE_ENV=production`
- `--max-old-space-size=4096` for large heaps
- Cluster mode for multi-core utilization
