# Qasati - Dockerfile
# Multi-stage build for production

# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

# Install yarn globally (more stable than npm in Docker)
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy config files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY ecosystem.config.js ./
COPY server/ ./server/

# Install dependencies with yarn
RUN yarn install --frozen-lockfile || yarn install

# Copy source code
COPY src/ ./src/
COPY api/ ./api/
COPY db/ ./db/
COPY contracts/ ./contracts/
COPY public/ ./public/

# Build with explicit paths
RUN yarn vite build && \
    yarn esbuild api/boot.ts \
      --platform=node \
      --bundle \
      --format=esm \
      --outdir=dist \
      --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

# Stage 2: Production
FROM node:20-slim AS production

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY ecosystem.config.js ./

# Install production deps
RUN npm install --only=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/public ./public

# Create directories
RUN mkdir -p /app/data /app/logs

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
