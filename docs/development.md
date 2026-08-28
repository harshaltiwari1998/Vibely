# Development

## Prerequisites

- **Node.js** ≥ 18, **npm** ≥ 9.
- **Docker** (Postgres + Redis) — optional locally, required for full runtime.
- **Android SDK + Gradle** — only for the Android app.
- **PostgreSQL** client if running DB outside Docker.

## Repository commands (root)

```bash
npm run build            # build all workspaces
npm run build:backend    # build only backend
npm run build:web        # build only web
npm run build:admin      # build only admin
npm test                 # run all workspace tests
npm run typecheck        # typecheck all
npm run prisma:generate  # regenerate Prisma client
npm run docker:up        # start Postgres + Redis + Backend
```

## Backend

```bash
cd services/backend
cp ../../.env.example .env
npm install
npx prisma generate
npm run build
npm start                 # listens on :4000
npm test
```

- Health/structure smoke test: `src/app.module.spec.ts`.
- DB/Redis connect **gracefully degrade** during boot if unavailable.

## Web

```bash
cd apps/web
npm install
npm run dev               # http://localhost:5173
npm run build             # tsc --noEmit && vite build
npm test
```

## Admin

```bash
cd apps/admin
npm install
npm run dev               # http://localhost:5174
npm run build
npm test
```

## Android

```bash
cd apps/android
./gradlew assembleDebug   # requires Android SDK + Gradle
```

- Original Compose theme in `ui/theme/*`, navigation in `ui/navigation/*`,
  MVVM in `ui/screens/**` + `data/**`.
- DI is a lightweight manual container (`di/AppContainer`); swap for Hilt later.

## Adding a new backend module

1. `services/backend/src/modules/<name>/` with `controller`, `service`, `module`, `dto`.
2. Register in `app.module.ts`.
3. Add DTOs/types to `@vibely/types` where shared.
4. Add unit/smoke test.

## Part 2 roadmap (not in Part 1)

- **Matching engine**: queue, scoring, `match_found` orchestration, timeouts.
- **WebRTC media**: TURN integration, `VideoCallService` full media + reconnect.
- **Chat**: persistence, history, realtime fan-out, translation.
- **Economy**: gift sending, wallet deductions, payments (Stripe) + webhooks.
- **Moderation**: auto-flagging, moderator UI, ban/suspend workflows.
- **Admin CRUD**: users/reports/calls/gifts/transactions management screens.
- **Notifications**: push (VAPID/FCM) + realtime delivery.
- **Discovery**: recommendation algorithm + preferences.
- **Real-time translation** of messages.
