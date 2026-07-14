# Qasati - Dockerfile
# Multi-stage build for production

# Stage 1: Build
FROM node:18 AS builder

WORKDIR /app

# Install build tools + pnpm
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY ecosystem.config.js ./
COPY server/ ./server/

# Install with pnpm (fast), then rebuild better-sqlite3 with npm
RUN pnpm install && npm rebuild better-sqlite3

# Copy source code
COPY src/ ./src/
COPY api/ ./api/
COPY db/ ./db/
COPY contracts/ ./contracts/
COPY public/ ./public/

# Build
RUN pnpm vite build && \
    pnpm esbuild api/boot.ts \
      --platform=node \
      --bundle \
      --format=esm \
      --outdir=dist \
      --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

# Stage 2: Production
FROM node:18-slim AS production

WORKDIR /app

# Install PM2 + pnpm
RUN npm install -g pm2 pnpm

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY ecosystem.config.js ./

# Install production deps + rebuild better-sqlite3
RUN pnpm install --prod && npm rebuild better-sqlite3

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/public ./public

RUN mkdir -p /app/data /app/logs

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
