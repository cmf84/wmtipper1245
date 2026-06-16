# syntax=docker/dockerfile:1

###############################
# 1) Dependencies (inkl. nativer Build-Tools für better-sqlite3)
###############################
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Build-Tools als Fallback, falls kein Prebuild für die Plattform existiert.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

###############################
# 2) Build
###############################
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

###############################
# 3) Runner (schlankes Laufzeit-Image)
###############################
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/data/wmtipper.db \
    ENABLE_SYNC=true

# Nicht als root laufen.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone-Output + statische Assets + Migrationsdateien + Migrations-Skript.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs

# Datenverzeichnis (wird per Volume gemountet).
RUN mkdir -p /data && chown -R nextjs:nodejs /data /app

USER nextjs
EXPOSE 3000

# Erst Migrationen anwenden, dann den Server starten (der den Cron-Poller startet).
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
