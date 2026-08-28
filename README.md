# Vibely

A social live **1-to-1 random video chat** platform (production-ready).

**Repository:** https://github.com/harshaltiwari1998/Vibely

## Monorepo Layout

```
/vibely
  /apps
    /web        React + TypeScript + Vite + Tailwind + Zustand + Axios
    /android    Kotlin + Jetpack Compose + MVVM + Retrofit + Room + DataStore
  /services
    /backend    Node.js + NestJS + Prisma + WebSockets
  /packages
    /config     Brand + environment configuration
    /types      Shared TypeScript types, DTOs, realtime event contract
    /shared     Logging (secret-safe), security & validation helpers
  /database     Prisma schema + migrations
  /infrastructure  Docker Compose (Postgres, Redis, Backend)
  /docs         Architecture, API, DB, realtime, security, deployment docs
```

## Features

### Core Features
- **User Authentication**: Registration, login, JWT + refresh tokens, password reset
- **User Profiles**: Age-verified profiles with preferences, photos, bio
- **Matchmaking**: Real-time match queue with preference-based matching
- **Video/Audio Calls**: WebRTC peer-to-peer calling with STUN/TURN
- **Real-time Chat**: Instant messaging with typing indicators, read receipts
- **Gifts**: Virtual gift system with coin economy
- **Wallet**: Coin purchase, transaction history, balance management
- **Notifications**: Real-time notifications for matches, calls, messages
- **Favorites**: Save favorite users for quick access
- **Call History**: Complete call history with duration and status
- **Blocking**: Block users to prevent matching, calling, and messaging
- **Reporting**: Report users with categories and descriptions
- **Admin Dashboard**: User management, reports, moderation, analytics
- **Moderation**: Text moderation, user status management, audit logging
- **Push Notifications**: FCM for Android, APNS for iOS
- **Localization**: English and Hindi support
- **Translation**: Real-time message translation

### Safety & Security
- Age verification (18+ enforced)
- Rate limiting on all critical endpoints
- Fraud detection and suspicious activity monitoring
- Block enforcement across all features
- Admin audit logging for all moderation actions
- Secure password hashing (bcrypt)
- JWT with refresh token rotation
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### 1. Clone Repository
```bash
git clone https://github.com/harshaltiwari1998/Vibely.git
cd vibely
```

### 2. Start Infrastructure
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

### 3. Configure Backend
```bash
cd services/backend
cp .env.example .env
# Edit .env with your secrets
```

Generate JWT secrets:
```bash
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
```

### 4. Install Dependencies & Build
```bash
npm install
npx prisma generate
npm run build
```

### 5. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 6. Start Backend
```bash
npm run start:prod
# Backend runs on http://localhost:4000
```

### 7. Start Web (Development)
```bash
cd apps/web
npm install
npm run dev
# Web runs on http://localhost:5173
```

### 8. Build Web for Production
```bash
cd apps/web
npm run build
# Serve dist/ folder with nginx
```

## Verification Status

| Target   | Build | Tests | Notes |
|----------|-------|-------|-------|
| Backend  | ✅    | ✅    | Builds, boots on :4000, smoke test passes |
| Web      | ✅    | ✅    | `npm run build` + Vitest pass |
| Android  | ⚠️    | —     | Source complete; build needs Android SDK |
| DB/Redis | ✅    | ✅    | Schema valid, migrations generate successfully |

## Production Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for:
- Docker Compose production setup
- Environment configuration
- SSL/TLS setup
- Database backups
- Scaling guidelines

## Security

See [docs/SECURITY.md](./docs/SECURITY.md) for:
- Authentication & authorization
- API security
- WebSocket security
- WebRTC security
- Data protection
- Payment security
- Admin security

## WebRTC

See [docs/WEBRTC.md](./docs/WEBRTC.md) for:
- Signaling flow
- STUN/TURN configuration
- Connection states
- Media constraints
- Troubleshooting

## Monitoring

See [docs/MONITORING.md](./docs/MONITORING.md) for:
- Health checks
- Metrics to track
- Alerting guidelines
- Logging best practices
- Backup strategy
- Disaster recovery

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for:
- System architecture
- Database schema
- API design
- Realtime events
- WebRTC flow

## Development

```bash
# Install all dependencies
npm install

# Run type checking
npm run typecheck --workspaces --if-present

# Run tests
npm test --workspace=services/backend
npm test --workspace=apps/web

# Build all packages
npm run build --workspaces --if-present
```

## Technology Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma
- **WebSockets**: Socket.IO
- **Authentication**: JWT + bcrypt
- **Validation**: class-validator

### Web
- **Framework**: React 18
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP**: Axios
- **WebSocket**: Socket.IO Client

### Android
- **Language**: Kotlin
- **UI**: Jetpack Compose
- **Architecture**: MVVM
- **Networking**: Retrofit
- **Database**: Room
- **Preferences**: DataStore
- **WebRTC**: Google WebRTC

## Known Limitations

1. **TURN Server**: Production deployment requires external TURN server for WebRTC
2. **File Storage**: S3-compatible storage required for file uploads
3. **Push Notifications**: FCM/APNS credentials required for mobile push
4. **Payment Provider**: Payment gateway credentials required for payments
5. **Monitoring**: External monitoring service (e.g., Sentry) recommended for error tracking
6. **CDN**: CDN recommended for static asset delivery in production

## Future Improvements

1. End-to-end encryption for messages
2. Advanced matching algorithm with ML
3. Video filters and effects
4. Group video calls
5. Live streaming
6. Advanced analytics dashboard
7. Multi-language support expansion
8. Offline mode for mobile apps
9. Biometric authentication
10. Social media integration

## License

Proprietary - All rights reserved
