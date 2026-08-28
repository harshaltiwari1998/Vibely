# Vibely Production Launch Checklist

## Pre-Launch Checklist

### Infrastructure
- [ ] Servers provisioned (backend, database, Redis, TURN)
- [ ] Domain name configured (vibely.app, admin.vibely.app)
- [ ] SSL/TLS certificates installed (Let's Encrypt)
- [ ] Firewall rules configured
- [ ] SSH access secured (key-based only)
- [ ] Monitoring agents installed
- [ ] Backup system configured

### Environment Configuration
- [ ] Production `.env` file created
- [ ] JWT_SECRET set to 32+ random characters
- [ ] JWT_REFRESH_SECRET set to 32+ random characters
- [ ] DATABASE_URL configured with production credentials
- [ ] REDIS_URL configured with production credentials
- [ ] CORS_ORIGIN set to actual domain (no wildcards)
- [ ] TURN_SERVER_URL configured
- [ ] PAYMENT_SECRET_KEY configured
- [ ] PUSH_NOTIFICATION_KEY configured
- [ ] STORAGE credentials configured

### Security
- [ ] All default passwords changed
- [ ] JWT secrets rotated from defaults
- [ ] CORS restricted to actual domains
- [ ] HTTPS enforced (HSTS enabled)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Password hashing using bcrypt (cost >= 10)
- [ ] Account lockout configured (5 attempts, 15 min)
- [ ] Session timeout configured (15 min access, 7 day refresh)
- [ ] `npm audit` run and vulnerabilities fixed
- [ ] Dependabot enabled

### Database
- [ ] Production database created
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Database seeded with initial data
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Backup automation configured
- [ ] Backup restoration tested
- [ ] Database monitoring configured

### Application
- [ ] Backend builds successfully
- [ ] Web builds successfully
- [ ] Admin builds successfully
- [ ] All tests pass
- [ ] Health check endpoint responds
- [ ] Error monitoring configured (Sentry)
- [ ] Log aggregation configured
- [ ] Performance monitoring configured

### Services
- [ ] PostgreSQL running and accessible
- [ ] Redis running and accessible
- [ ] Backend service running
- [ ] Web service running
- [ ] Nginx reverse proxy configured
- [ ] WebSocket connections working
- [ ] TURN server running and accessible
- [ ] STUN servers configured

### WebRTC
- [ ] STUN server reachable
- [ ] TURN server reachable
- [ ] TURN credentials configured
- [ ] WebRTC calls working (Web ↔ Web)
- [ ] WebRTC calls working (Web ↔ Android)
- [ ] Different network types tested (WiFi, mobile, VPN)
- [ ] NAT traversal tested
- [ ] Call reconnection tested
- [ ] Call failure handling tested

### Features
- [ ] Registration/Login flow works
- [ ] Profile setup works
- [ ] Matchmaking works
- [ ] Video calls work
- [ ] Audio calls work
- [ ] Chat messaging works
- [ ] Gift sending works
- [ ] Wallet/payments work (test mode)
- [ ] Notifications work
- [ ] Call history works
- [ ] Blocking works
- [ ] Reporting works
- [ ] Admin dashboard works
- [ ] Moderation tools work

### Mobile (Android)
- [ ] App builds successfully
- [ ] Login/Register works
- [ ] Push notifications configured
- [ ] Camera permissions granted
- [ ] Microphone permissions granted
- [ ] WebRTC calls work
- [ ] Chat works
- [ ] Wallet works
- [ ] Notifications received
- [ ] Deep links work

### Performance
- [ ] Load testing completed
- [ ] Database queries optimized
- [ ] API response times acceptable (<500ms)
- [ ] WebSocket latency acceptable (<100ms)
- [ ] Image optimization enabled
- [ ] Code splitting enabled
- [ ] Caching configured

### Legal & Compliance
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie Policy published (if applicable)
- [ ] Age verification (18+) implemented
- [ ] Content moderation policy published
- [ ] GDPR compliance verified (if EU users)
- [ ] COPPA compliance verified
- [ ] Data retention policy defined
- [ ] User data deletion capability implemented

### Documentation
- [ ] README.md updated
- [ ] API documentation generated
- [ ] Deployment guide finalized
- [ ] Security documentation finalized
- [ ] WebRTC documentation finalized
- [ ] Monitoring documentation finalized
- [ ] Runbook created
- [ ] Troubleshooting guide created

### Final Checks
- [ ] Security checklist completed
- [ ] Penetration testing completed
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] On-call rotation established
- [ ] Incident response plan documented
- [ ] Support channels established
- [ ] Launch communication prepared

## Launch Day Checklist

### 1 Hour Before Launch
- [ ] All services running
- [ ] Health checks passing
- [ ] Monitoring dashboards accessible
- [ ] Team notified
- [ ] Rollback plan ready

### Launch
- [ ] DNS propagated
- [ ] SSL certificates valid
- [ ] Application accessible
- [ ] Registration flow tested
- [ ] Payment flow tested (test mode)
- [ ] Monitoring alerts configured

### 24 Hours After Launch
- [ ] Error rates monitored
- [ ] Performance metrics reviewed
- [ ] User feedback collected
- [ ] Critical bugs fixed
- [ ] Team debrief scheduled
