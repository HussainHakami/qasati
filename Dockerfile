# Qasati - Dockerfile
# Multi-stage build for production

# Stage 1: Build (uses full node image with dev dependencies)
FROM node:18 AS builder

WORKDIR /app

# Copy all config files first
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY ecosystem.config.js ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY server/ ./server/
COPY api/ ./api/
COPY db/ ./db/
COPY contracts/ ./contracts/
COPY public/ ./public/

# Create empty .env for build (Vite may need it)
RUN echo "VITE_APP_ID=dummy" > .env

# Build frontend (vite) and backend (esbuild)
RUN npx vite build && \
    npx esbuild api/boot.ts \
      --platform=node \
      --bundle \
      --format=esm \
      --outdir=dist \
      --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

# Stage 2: Production (slim image with only production deps)
FROM node:18-slim AS production

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY ecosystem.config.js ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/public ./public

# Create directories
RUN mkdir -p /app/data /app/logs

# Expose port
EXPOSE 3000

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
