# syntax=docker/dockerfile:1.7
#
# Production image for the PGConnect web app (Next.js standalone output).
#   docker build -t pgconnect-web --build-arg NEXT_PUBLIC_SITE_URL=https://pgconnect.site .
#   docker run -p 3000:3000 --env-file .env -e RUN_MIGRATIONS=true pgconnect-web
#
# NEXT_PUBLIC_* values and the image host settings in next.config.ts are baked
# in at build time, so pass them as build args. Everything else is read at runtime.

ARG NODE_IMAGE=node:22-alpine

# ---- deps: install all dependencies (postinstall runs `prisma generate`) ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile --network-timeout 600000 && yarn cache clean

# ---- builder: compile the app ----
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

ARG NEXT_PUBLIC_SITE_URL=https://pgconnect.site
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ARG NEXT_PUBLIC_SOCKET_URL=
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
ARG AWS_REGION=
ARG AWS_BUCKET_NAME=
ARG AWS_PUBLIC_BASE_URL=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
    AWS_REGION=$AWS_REGION \
    AWS_BUCKET_NAME=$AWS_BUCKET_NAME \
    AWS_PUBLIC_BASE_URL=$AWS_PUBLIC_BASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && yarn build

# ---- runner: minimal runtime image ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl \
 && addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    RUN_MIGRATIONS=false

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Prisma CLI + engines for `migrate deploy` (not part of the traced standalone bundle).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

COPY --chmod=755 <<'EOF' /usr/local/bin/docker-entrypoint.sh
#!/bin/sh
set -e
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] applying database migrations"
  node ./node_modules/prisma/build/index.js migrate deploy --schema ./prisma/schema.prisma
fi
exec "$@"
EOF

# Local storage driver (STORAGE_DRIVER=local). Mount a persistent volume here.
ENV STORAGE_LOCAL_DIR=/app/storage
RUN mkdir -p /app/storage && chown -R nextjs:nodejs /app/storage
VOLUME ["/app/storage"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
