# Vibely Security Checklist

## Pre-Launch Security Checklist

### Authentication & Authorization
- [ ] JWT_SECRET is 32+ random characters (not default)
- [ ] JWT_REFRESH_SECRET is 32+ random characters (different from JWT_SECRET)
- [ ] Default admin password changed
- [ ] Password hashing uses bcrypt with cost factor >= 10
- [ ] Refresh tokens are rotated on each use
- [ ] Account lockout after 5 failed login attempts configured
- [ ] Session timeout configured (15 min access, 7 day refresh)

### API Security
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS_ORIGIN set to actual domain (no wildcards in production)
- [ ] Input validation enabled (class-validator whitelist)
- [ ] SQL injection prevention verified (Prisma ORM)
- [ ] XSS prevention verified (React escaping)
- [ ] CSRF protection enabled (SameSite cookies)
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)

### WebSocket Security
- [ ] WebSocket requires JWT authentication
- [ ] Invalid tokens result in immediate disconnect
- [ ] WebSocket events are scoped to authenticated users only
- [ ] Admin events require MODERATOR/ADMIN role

### Data Protection
- [ ] HTTPS/TLS 1.3 enabled in production
- [ ] Database connections encrypted
- [ ] Redis connections encrypted (if external)
- [ ] Passwords never logged
- [ ] JWT tokens never logged
- [ ] Payment secrets never logged
- [ ] Call media not recorded by default
- [ ] PII minimized in logs

### Payment Security
- [ ] Payment webhooks verified with HMAC signatures
- [ ] Idempotency keys enforced
- [ ] Coin transactions use database transactions (atomic)
- [ ] Payment amounts validated server-side
- [ ] No client-side price validation trusted

### Infrastructure Security
- [ ] Docker containers run as non-root user
- [ ] No secrets in Docker images
- [ ] Database not exposed to public internet
- [ ] Redis not exposed to public internet
- [ ] Firewall rules configured
- [ ] SSH key-based authentication only
- [ ] Fail2ban or similar configured for SSH

### Dependency Security
- [ ] `npm audit` run and high/critical vulnerabilities fixed
- [ ] Dependabot enabled for security patches
- [ ] Lock files committed (package-lock.json)
- [ ] No known vulnerabilities in dependencies

### Monitoring & Logging
- [ ] Error tracking configured (Sentry recommended)
- [ ] Log aggregation configured (ELK/Loki)
- [ ] Alerts configured for critical errors
- [ ] Health check endpoint accessible
- [ ] Rate limit violations monitored
- [ ] Failed authentication attempts monitored

### Compliance
- [ ] Age verification (18+) enforced
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Data retention policy defined
- [ ] User data deletion capability implemented
- [ ] GDPR compliance (if EU users)
- [ ] COPPA compliance verified

### Backup & Recovery
- [ ] Automated daily database backups configured
- [ ] Backup restoration tested
- [ ] Backup encryption enabled
- [ ] Disaster recovery plan documented
- [ ] RTO and RPO defined

## Penetration Testing Checklist

### Authentication Bypass
- [ ] Cannot access protected routes without token
- [ ] Cannot access other user's data with modified JWT
- [ ] Cannot bypass role checks
- [ ] Cannot reuse expired tokens
- [ ] Cannot use revoked refresh tokens

### Authorization Bypass
- [ ] Normal user cannot access admin APIs
- [ ] Normal user cannot modify coin balance
- [ ] Normal user cannot create fake payment confirmations
- [ ] Normal user cannot access another user's private data
- [ ] Banned user cannot access any protected routes
- [ ] Blocked user cannot match, call, or message

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] Path traversal attempts blocked
- [ ] Oversized payloads rejected
- [ ] Invalid JSON rejected

### Rate Limiting
- [ ] Rate limiting enforced on login
- [ ] Rate limiting enforced on registration
- [ ] Rate limiting enforced on matchmaking
- [ ] Rate limiting enforced on messages
- [ ] Rate limiting enforced on reports

### WebRTC Security
- [ ] Signaling messages validated
- [ ] No sensitive data in SDP offers/answers
- [ ] TURN credentials time-limited
- [ ] Media not recorded without consent
