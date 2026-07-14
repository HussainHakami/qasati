# Qasati - Dockerfile
# Multi-stage build for production

# Stage 1: Build
FROM node:18 AS builder

WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY ecosystem.config.js ./
COPY server/ ./server/

# Step 1: Install deps without scripts (fast, stable)
RUN npm install --ignore-scripts

# Step 2: Install packages that need postinstall scripts individually
RUN npm install @hono/vite-dev-server esbuild

# Step 3: Rebuild native bindings
RUN npm rebuild better-sqlite3

# Copy source code
COPY src/ ./src/
COPY api/ ./api/
COPY db/ ./db/
COPY contracts/ ./contracts/
COPY public/ ./public/

# Build using npx (vite/esbuild now in node_modules)
RUN ./node_modules/.bin/vite build && \
    ./node_modules/.bin/esbuild api/boot.ts \
      --platform=node \
      --bundle \
      --format=esm \
      --outdir=dist \
      --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

# Stage 2: Production
FROM node:18-slim AS production

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY ecosystem.config.js ./

# Install production deps (ignore-scripts for stability)
RUN npm install --ignore-scripts --only=production && \
    npm rebuild better-sqlite3

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
