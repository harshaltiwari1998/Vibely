# Vibely Security Documentation

## Authentication & Authorization

### JWT Security
- Access tokens expire after 15 minutes (configurable)
- Refresh tokens expire after 7 days (configurable)
- Refresh tokens are rotated on each use
- JWT secrets must be at least 32 characters in production
- Tokens are transmitted only over HTTPS
- Tokens are stored securely (httpOnly cookies recommended for web)

### Password Security
- Minimum password length: 8 characters
- Passwords must contain letters and numbers
- Passwords are hashed using bcrypt (never stored in plain text)
- Password reset tokens expire after 1 hour
- Account lockout after 5 failed login attempts (15-minute lockout)

### Session Security
- Session tokens are hashed before storage
- Sessions can be revoked from admin panel
- Concurrent session limits can be configured
- User agent and IP address logged for security review

## API Security

### Rate Limiting
- Global rate limit: 30 requests per minute per IP/user
- Matchmaking rate limit: 5 requests per minute
- Login/registration: additional throttling applied
- Rate limits stored in Redis with sliding window

### Input Validation
- All inputs validated using class-validator
- Whitelist validation enabled (reject unknown fields)
- SQL injection prevented by Prisma ORM
- XSS prevention via React escaping and Content-Security-Policy headers

### CORS
- Configured via `CORS_ORIGIN` environment variable
- In production, set to specific origins (no wildcards)
- Credentials enabled for authenticated requests
- Only GET, POST, PUT, PATCH, DELETE, OPTIONS methods allowed

### CSRF Protection
- SameSite cookie attributes set
- CSRF tokens for state-changing operations (recommended for web)
- Origin and Referer headers validated

## WebSocket Security

### Authentication
- WebSocket connections require valid JWT token
- Token passed via auth handshake or query parameter
- Invalid tokens result in immediate disconnect
- Connections are authenticated before any events are processed

### Authorization
- Users can only emit events for their own actions
- Real-time events are scoped to relevant users only
- Admin events require MODERATOR/ADMIN/SUPER_ADMIN role

### Signaling Security
- WebRTC signaling messages validated
- SDP offers/answers checked for validity
- ICE candidates validated before forwarding
- No sensitive data transmitted via signaling

## WebRTC Security

### Media Transport
- Media flows peer-to-peer via WebRTC
- No media passes through backend servers
- DTLS encryption for all media streams
- SRTP for audio/video encryption

### STUN/TURN
- STUN servers used for NAT traversal
- TURN servers required for restrictive networks
- TURN credentials time-limited and rotated
- TURN traffic encrypted

## Data Protection

### Sensitive Data
- Passwords never logged or exposed
- Payment secrets never logged
- Private tokens never logged
- Call media not recorded by default
- Personal identifiable information (PII) minimized in logs

### Data Access
- Users can only access their own data
- Admin access is audited and logged
- Database queries parameterized (Prisma)
- No direct database access from frontend

### Encryption
- TLS 1.3 required for all connections in production
- Database connections encrypted
- Redis connections encrypted (if using external service)
- Secrets stored in environment variables (never in code)

## Payment Security

### Payment Processing
- Payment webhooks verified using HMAC signatures
- Idempotency keys prevent duplicate charges
- Coin transactions atomic (database transactions)
- Payment amounts validated against packages
- No client-side price validation

### Wallet Security
- Coin balances never negative
- All transactions logged with audit trail
- Admin adjustments require audit logging
- Gift coin transfers atomic

## Admin & Moderation Security

### Admin Access
- Admin routes protected by role-based access control
- Admin actions logged with moderator ID
- All moderation actions auditable
- Admin passwords subject to same policies as users

### Moderation Actions
- Bans/suspensions logged with reason and moderator
- User status changes cannot be bypassed
- Restricted users cannot match, call, or message
- Blocked users excluded from all interactions

## Infrastructure Security

### Docker Security
- Non-root user in containers
- Multi-stage builds to minimize attack surface
- Alpine Linux base images (minimal attack surface)
- No secrets in Docker images

### Network Security
- Services communicate via internal Docker network
- Only backend and web exposed to internet
- Database and Redis not publicly accessible
- Firewall rules restrict traffic

### Backup Security
- Backups encrypted at rest
- Backup access restricted to authorized personnel
- Regular backup integrity checks

## Vulnerability Management

### Dependencies
- Regular `npm audit` scans
- Dependabot enabled for security patches
- Lock files committed for reproducible builds

### Monitoring
- Error tracking for unhandled exceptions
- Rate limit violations logged
- Suspicious activity flagged for review
- Failed authentication attempts monitored

## Compliance

### Age Verification
- Minimum age enforced (18+)
- Age validation on registration
- Underage safety reports prioritized

### Data Retention
- User data retained per policy
- Deleted users' data anonymized
- Logs retained for security review period

## Incident Response

### Security Incidents
- Admin can ban/suspend users immediately
- Audit logs preserve evidence
- Rollback procedures documented
- Contact information for security team

### Reporting
- Users can report suspicious behavior
- Reports reviewed within SLA
- Escalation path for critical issues
