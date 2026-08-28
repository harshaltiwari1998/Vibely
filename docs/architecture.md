# Vibely Architecture Documentation

**Repository:** https://github.com/harshaltiwari1998/Vibely

## System Overview

Vibely is a real-time video chat platform built with a microservices-oriented monorepo architecture. The system enables users to discover, match, and communicate via video, audio, and text.

## High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │     │ Android App │     │ Admin Panel │
│  (React)    │     │ (Compose)   │     │   (React)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Backend   │
                    │  (NestJS)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
     │ PostgreSQL│   │   Redis   │   │ WebRTC    │
     │           │   │           │   │ Signaling │
     └───────────┘   └───────────┘   └───────────┘
                           │
                    ┌──────▼──────┐
                    │   STUN/     │
                    │   TURN      │
                    └─────────────┘
```

## Backend Architecture

### Module Structure
```
src/
  modules/
    auth/          - Authentication, registration, JWT
    users/         - User CRUD, profile management
    profiles/      - Profile management, online status
    matching/      - Matchmaking queue, matching logic
    calls/         - Call initiation, history, participants
    chat/          - Messages, conversations, real-time chat
    gifts/         - Gift catalog, transactions
    wallet/        - Coin balance, transactions
    payments/      - Payment processing, webhooks
    notifications/ - Notification CRUD, push integration
    devices/       - Device registration for push
    push/          - FCM/APNS push notification service
    translation/   - Text translation, language detection
    reports/       - User/content reporting
    blocks/        - User blocking
    moderation/    - Moderation actions, text detection
    admin/         - Admin dashboard, user management
    fraud/         - Fraud detection, suspicious activity
  common/
    guards/        - JWT, roles guards
    decorators/    - Current user, roles decorators
    filters/       - Exception filters
    interceptors/  - Transform, logging interceptors
    middleware/    - Rate limiting
  realtime/
    realtime.gateway.ts - WebSocket gateway
    presence.service.ts - User presence tracking
  database/
    prisma.service.ts   - Prisma client
  cache/
    redis.service.ts    - Redis client
  health/
    health.controller.ts - Health check endpoint
```

### API Design
- RESTful API with `/api` prefix
- JSON request/response format
- JWT authentication via `Authorization: Bearer <token>`
- Role-based access control (User, Moderator, Admin, SuperAdmin)
- Input validation via class-validator
- Standardized response format via interceptors

### WebSocket Events
```
Client → Server:
  - match_request
  - match_cancel
  - match_accept
  - match_decline
  - call_offer
  - call_answer
  - ice_candidate
  - message_sent
  - typing_started
  - typing_stopped
  - gift_sent
  - notification_read
  - notification_deleted

Server → Client:
  - match_searching
  - match_found
  - match_cancelled
  - match_expired
  - call_started
  - call_ready
  - call_ended
  - call_failed
  - call_reconnect
  - message_sent
  - message_delivered
  - message_read
  - typing_started
  - typing_stopped
  - gift_sent
  - gift_received
  - payment_created
  - payment_succeeded
  - payment_failed
  - notification_created
  - user_online
  - user_offline
```

## Database Schema

### Core Models
- **User**: Authentication, profile link, status
- **Profile**: Bio, interests, online status
- **UserPreference**: Matching preferences
- **UserSession**: Active sessions for token management
- **Device**: Push notification device tokens
- **Wallet**: Coin balance
- **CoinTransaction**: Transaction history
- **CoinPackage**: Coin purchase packages
- **Payment**: Payment records
- **Gift**: Gift catalog
- **GiftTransaction**: Gift sending history
- **Message**: Chat messages
- **Chat**: Conversation between two users
- **Call**: Call records
- **CallParticipant**: Call participants
- **Match**: Match records
- **Notification**: User notifications
- **Report**: User reports
- **Block**: User blocks
- **Favorite**: Favorited users
- **UserBan**: Active bans
- **ModerationAction**: Audit log for moderation

### Indexes
Comprehensive indexes added for:
- User queries (status, country, createdAt)
- Matching (status, userA, userB, createdAt)
- Calls (initiatorId, receiverId, status, startedAt)
- Messages (chatId, senderId, createdAt)
- Transactions (userId, type, createdAt)
- Payments (userId, status, createdAt)
- Notifications (userId, read, createdAt)
- Reports (status, targetUserId, reporterId, createdAt)
- Blocks (blockerId, blockedId)
- Moderation (moderatorId, targetUserId, createdAt)

## Frontend Architecture (Web)

### State Management
- **Zustand**: Global state (auth, user preferences)
- **React Query**: Server state (API caching, background refetch)
- **Local State**: Component-level state

### Routing
- React Router v6
- Protected routes with authentication guard
- Admin routes with role guard

### Real-time
- Socket.IO client for WebSocket connections
- Auto-reconnection with exponential backoff
- Event-based architecture

### UI Components
- Custom component library (Button, Input, Card, Page, Layout)
- Tailwind CSS for styling
- Responsive design (mobile-first)

## Mobile Architecture (Android)

### Architecture Pattern
- MVVM (Model-View-ViewModel)
- Repository pattern for data access
- Dependency injection (manual)

### State Management
- StateFlow/Flow for reactive streams
- ViewModel for UI state
- DataStore for preferences

### Networking
- Retrofit for REST API
- Socket.IO client for WebSocket
- Coroutines for async operations

### Database
- Room for local persistence
- DataStore for preferences

### UI
- Jetpack Compose for declarative UI
- Material 3 design system
- Navigation Compose for routing

## Security Architecture

### Authentication Flow
1. User registers with email/password
2. Password hashed with bcrypt
3. JWT access token (15min) + refresh token (7d) issued
4. Tokens stored securely
5. Access token used for API requests
6. Refresh token rotated on each use
7. Logout invalidates refresh token

### Authorization
- Role-based access control (RBAC)
- JWT claims contain user roles
- Guards validate roles on protected routes
- Admin actions audited

### Data Protection
- TLS 1.3 for all connections
- Passwords never logged
- Secrets in environment variables
- Database queries parameterized

## Scalability

### Horizontal Scaling
- Backend instances stateless (except WebSocket state in Redis)
- Load balancer distributes traffic
- Database connection pooling
- Redis for shared state

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Regular VACUUM and ANALYZE
- Index optimization

### Caching Strategy
- Redis for session data
- Redis for rate limiting
- Redis for matchmaking queue
- Redis for presence data
- HTTP caching headers for static assets

## Monitoring & Observability

### Health Checks
- `/api/health` endpoint
- Database connectivity check
- Redis connectivity check

### Logging
- Structured logging with timestamps
- Secret-safe logger (redacts sensitive data)
- Log levels: ERROR, WARN, INFO, DEBUG

### Metrics (Recommended)
- Request latency
- Error rates
- Database query performance
- WebSocket connection count
- Call success/failure rates

## Deployment Architecture

```
┌─────────────┐
│   Internet  │
└──────┬──────┘
       │
   ┌───▼────┐
   │   CDN  │ (Static assets, images)
   └───┬────┘
       │
   ┌───▼────────┐
   │ Load       │
   │ Balancer   │
   └───┬────────┘
       │
   ┌───▼────────┐
   │   Nginx    │ (SSL termination, reverse proxy)
   └───┬────────┘
       │
   ┌───▼────────┐
   │  Backend   │ (NestJS, port 4000)
   └───┬────────┘
       │
   ┌───┴──────────┐
   │              │
┌──▼─────┐   ┌────▼─────┐
│Postgres│   │  Redis   │
└────────┘   └──────────┘
```

## CI/CD Pipeline

1. **Lint & Type Check**: Validate code quality
2. **Test**: Run unit and integration tests
3. **Build**: Build Docker images
4. **Security Scan**: npm audit, vulnerability scanning
5. **Deploy**: Deploy to production (manual trigger)

## Disaster Recovery

- Daily PostgreSQL backups
- Weekly full backups with 30-day retention
- Point-in-time recovery capability
- Redis persistence (AOF + RDB)
- Documented rollback procedures
- RTO: < 1 hour
- RPO: < 24 hours
