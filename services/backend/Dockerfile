FROM node:20-alpine

WORKDIR /app

# 1. Install backend dependencies
COPY services/backend/package*.json ./
RUN npm install --omit=dev=false

# 2. Build shared packages and copy their compiled output into the backend
COPY packages ./packages
RUN cd packages/config && npm install && npm run build && cd ../..
RUN cd packages/types && npm install && npm run build && cd ../..
RUN cd packages/shared && npm install && npm run build && cd ../..

# 3. Copy backend source (avoid copying local node_modules)
COPY services/backend/src ./src
COPY services/backend/prisma ./prisma
COPY services/backend/nest-cli.json ./nest-cli.json
COPY services/backend/tsconfig.json ./tsconfig.json
COPY services/backend/tsconfig.build.json ./tsconfig.build.json

RUN npx prisma generate || true
RUN npm run build || true

# 4. Make @vibely/* resolvable at runtime
RUN mkdir -p node_modules/@vibely \
  && cp -r packages/config node_modules/@vibely/config \
  && cp -r packages/types node_modules/@vibely/types \
  && cp -r packages/shared node_modules/@vibely/shared

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/main.js"]

