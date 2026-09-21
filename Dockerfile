# Multi-stage build for the NestJS backend, run from the monorepo root:
#   docker build -t vibely-backend .
# Lives at the repo root (not services/backend/) so Railway's builder
# auto-detects it without extra config.

FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npm ci

RUN npm run build -w packages/types
RUN npm run build -w packages/shared
RUN npm run prisma:generate -w services/backend
RUN npm run build -w services/backend

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/backend/dist ./services/backend/dist
COPY --from=builder /app/services/backend/prisma ./services/backend/prisma
COPY --from=builder /app/services/backend/package.json ./services/backend/package.json

EXPOSE 4000
CMD ["node", "services/backend/dist/main.js"]
