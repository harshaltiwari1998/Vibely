# Database

PostgreSQL accessed through **Prisma** (`services/backend/prisma/schema.prisma`).

## Connection

Configured via `DATABASE_URL` in `.env`. Generate the client with:

```bash
cd services/backend
npx prisma generate
npx prisma migrate dev
```

## Core models (implemented)

### User
`id, username, email, passwordHash, dateOfBirth, gender, country, language,
avatarUrl, status, createdAt, updatedAt`

- `passwordHash` is **bcrypt** output — plaintext never stored.
- `status`: `PENDING | ACTIVE | SUSPENDED | BANNED`.
- Unique: `username`, `email`.

### Profile
`id, userId, bio, interests[], onlineStatus, lastSeen, createdAt, updatedAt`
(1:1 with User).

### UserPreference
`id, userId, preferredGender, preferredAgeMin, preferredAgeMax,
preferredCountries[], preferredLanguages[]` (1:1 with User).

## Prepared models (Part 2)

Already in the schema, ready for implementation:

`Match, Call, CallParticipant, Chat, Message, Favorite, Gift,
GiftTransaction, Wallet, CoinTransaction, Payment, Notification, Report,
Block, UserSession, Device, UserBan, ModerationAction`.

### Relationship summary

- `User` ↔ `Profile`, `UserPreference` (1:1, cascade delete).
- `User` → `Match` (initiator + matched), `Call` (initiator + receiver),
  `CallParticipant`, `Message`, `Report` (reporter + reported),
  `GiftTransaction` (sender + receiver), `Wallet`, `CoinTransaction`,
  `Payment`, `Notification`, `Block`, `Favorite`, `Device`, `UserSession`,
  `UserBan`, `ModerationAction` (moderator + target).

## Indexing

Indexes exist on `User(country, status)`, `Match(status)`, `Message(chatId)`,
`CoinTransaction(userId)`, `Payment(userId)`, `Notification(userId)`,
`Report(status)` to support common queries.

## Migrations & seeds

- Migrations live in `services/backend/prisma/migrations` (created by
  `prisma migrate dev` once DB is reachable).
- No PII or secrets are ever written to logs or migrations.
