# syntax=docker/dockerfile:1.7
# ---------- 1) deps: install once with full lockfile, cache-friendly ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only manifests first so this layer caches when source changes but deps don't.
COPY package.json package-lock.json* ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json

RUN npm ci --include=dev

# ---------- 2) build: compile server + bundle client ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

COPY . .

RUN npm run build

# Strip dev deps from the workspace install used at runtime.
RUN npm prune --omit=dev --workspaces --include-workspace-root

# ---------- 3) runtime: minimal image, non-root ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8787 \
    CLIENT_DIST_PATH=/app/client/dist

# Bring in only what the server needs at runtime.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/package.json ./package.json

# Drop root.
RUN addgroup -S app && adduser -S app -G app \
 && chown -R app:app /app
USER app

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8787/api/health || exit 1

CMD ["node", "server/dist/index.js"]
