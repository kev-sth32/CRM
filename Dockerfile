# ==========================================
# Production Multi-Stage Dockerfile: SalesOS
# ==========================================

# Stage 1: Dependencies Cache
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Security: Run under unprivileged node user
USER node

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Fast, low-overhead health check using Alpine built-in wget (no extra Node process)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
