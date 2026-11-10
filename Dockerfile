# ==============================================================================
# VISTERIA PEOPLE & PROCESS EXCELLENCE AI SURVEY PLATFORM
# MULTI-STAGE PRODUCTION DOCKERFILE
# ==============================================================================

# STAGE 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# STAGE 2: Build Backend
FROM node:20-alpine AS server-builder
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apk add --no-cache openssl
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# STAGE 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Use system Chromium for Puppeteer PDF reports (bundled Chrome does not run on Alpine/musl)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN apk add --no-cache openssl chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto

# Install production dependencies for server
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy compiled backend
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/src/templates ./dist/templates
COPY server/scripts ./scripts

# Copy frontend static and production assets
COPY --from=client-builder /app/client/public /app/client/public
COPY --from=client-builder /app/client/dist /app/client/dist
COPY public /app/public

# Uploads directory
RUN mkdir -p /app/server/uploads

EXPOSE 3000

# Default entrypoint runs server
CMD ["node", "dist/index.js"]
