# Qasati - Dockerfile
# Multi-stage build for production

# Stage 1: Build
FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./

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
FROM node:18-slim AS production

WORKDIR /app

# Install PM2 for process management
RUN npm install -g pm2

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts

# Copy PM2 config
COPY ecosystem.config.js ./

# Create data directory
RUN mkdir -p /app/data /app/logs

# Expose port
EXPOSE 3000

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
