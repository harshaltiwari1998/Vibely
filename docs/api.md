# API

Base URL: `http://localhost:4000/api` (configurable via `API_PORT`, `WEB_URL`).
All timestamps ISO-8601. All responses are JSON.

## Envelope

Success: `{ "success": true, "data": <T> }`
Error (never leaks secrets): `{ "success": false, "message": string }`

## Authentication

| Method | Path                       | Body                                  | Auth |
|--------|----------------------------|---------------------------------------|------|
| POST   | `/auth/register`           | username, email, password, dateOfBirth, gender, country, language | — |
| POST   | `/auth/login`              | identifier, password                  | — |
| POST   | `/auth/refresh`            | refreshToken                          | — |
| POST   | `/auth/logout`             | —                                     | Bearer |
| POST   | `/auth/forgot-password`    | email                                 | — |
| POST   | `/auth/reset-password`     | token, password                       | — |

Passwords are hashed with **bcrypt**; plaintext is never stored or returned.

## Users & Profiles

| Method | Path                     | Auth | Notes |
|--------|--------------------------|------|-------|
| GET    | `/users/me`              | ✅   | current user + profile + prefs |
| GET    | `/users?page&limit`      | ✅   | paginated list |
| GET    | `/users/:id`             | ✅   | public projection |
| POST   | `/users/me/profile`      | ✅   | update bio/interests |
| POST   | `/users/me/preferences`  | ✅   | discovery preferences |

## Discovery / Matching / Calls / Chat

| Method | Path                  | Auth | Notes |
|--------|-----------------------|------|-------|
| GET    | `/profiles/discover`  | ✅   | discovery feed |
| POST   | `/profiles/online`    | ✅   | set online status |
| POST   | `/matching/request`   | ✅   | enqueue 1-to-1 match |
| POST   | `/matching/cancel`    | ✅   | cancel match |
| POST   | `/calls/initiate`     | ✅   | start call |
| POST   | `/calls/:id/end`      | ✅   | end call |
| GET    | `/calls/history`      | ✅   | call history |
| GET    | `/chat`               | ✅   | list chats |
| GET    | `/chat/:chatId/messages` | ✅ | messages |
| POST   | `/chat/message`       | ✅   | send message |

## Economy

| Method | Path                  | Auth | Notes |
|--------|-----------------------|------|-------|
| GET    | `/gifts`              | ✅   | gift catalogue |
| POST   | `/gifts/send`         | ✅   | send gift |
| GET    | `/wallet`             | ✅   | balance |
| GET    | `/wallet/transactions`| ✅   | coin ledger |
| POST   | `/wallet/coins`       | ✅   | add coins (purchase) |
| POST   | `/payments/create`    | ✅   | create payment intent |
| POST   | `/payments/webhook`   | —    | provider webhook (verified) |
| GET    | `/payments/transactions` | ✅ | payment ledger |

## Social / Safety

| Method | Path                  | Auth | Notes |
|--------|-----------------------|------|-------|
| GET    | `/notifications`      | ✅   | list notifications |
| POST   | `/notifications/:id/read` | ✅ | mark read |
| POST   | `/reports`            | ✅   | create report |
| POST   | `/reports/block`      | ✅   | block a user |
| GET    | `/reports`            | ✅   | list reports |
| POST   | `/reports/:id/resolve`| ✅   | resolve (Part 2) |
| POST   | `/moderation/ban`     | Moderator+ | ban user |
| POST   | `/moderation/suspend` | Moderator+ | suspend user |
| GET    | `/moderation/actions` | Moderator+ | moderation log |

## Admin

`/admin/stats`, `/admin/users`, `/admin/reports`, `/admin/calls`,
`/admin/gifts`, `/admin/transactions`, `/admin/settings` — guarded by
`RolesGuard` with `ADMIN`/`SUPER_ADMIN`.

> Endpoints are scaffolded in Part 1; orchestration logic is implemented in
> Part 2.
