FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/backend/package*.json ./services/backend/
COPY apps/web/package*.json ./apps/web/
COPY apps/admin/package*.json ./apps/admin/
COPY packages/config/package*.json ./packages/config/
COPY packages/types/package*.json ./packages/types/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY . .
RUN cd packages/config && npm run build
RUN cd packages/types && npm run build
RUN cd packages/shared && npm run build
RUN cd services/backend && npx prisma generate
RUN cd services/backend && npm run build

FROM node:20-alpine
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nestjs:nodejs /app/services/backend/dist ./services/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/services/backend/package*.json ./services/backend/

USER nestjs

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "services/backend/dist/main"]
