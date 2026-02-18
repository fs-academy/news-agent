# NewsAgent API - Node.js Backend
# Optimized Dockerfile for Easypanel deployment

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS production
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src

USER nodejs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["node", "src/index.js"]