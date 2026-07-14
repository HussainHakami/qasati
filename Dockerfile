# Qasati - Dockerfile
# Multi-stage build for production

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./
# Note: .env is not copied - environment variables passed at runtime
# via docker-compose or docker run --env-file

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY server/ ./server/
COPY api/ ./api/
COPY db/ ./db/
COPY contracts/ ./contracts/
COPY public/ ./public/

# Build frontend and backend
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Install PM2 for process management
RUN npm install -g pm2

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
# .env passed at runtime via docker-compose or --env-file

# Install production dependencies only
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/ping || exit 1

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
