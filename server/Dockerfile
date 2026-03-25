# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
RUN npm ci
COPY src ./src
COPY public ./public
RUN npm run build

# Stage 2: Build server
FROM node:22-alpine AS server-builder
WORKDIR /app
COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm ci
COPY server/src ./src
RUN npm run build

# Stage 3: Production
FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production

# Copy compiled server
COPY --from=server-builder /app/dist ./dist

# Copy built frontend into dist/public so Express can serve it
COPY --from=frontend-builder /app/dist ./dist/public

# Create data directories
RUN mkdir -p /data/db /data/photos

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /data
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
