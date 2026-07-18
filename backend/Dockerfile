# ---- Base ----
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Production image ----
FROM base AS production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/healthz || exit 1

CMD ["node", "src/server.js"]
