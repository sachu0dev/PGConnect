# syntax=docker/dockerfile:1

# ---- deps: full install (dev deps needed for tsc + prisma generate) ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile

# ---- build: compile TypeScript and generate the Prisma client ----
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN yarn prisma generate && yarn build

# ---- prod-deps: production dependencies only ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production --ignore-scripts && yarn cache clean

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000
RUN apk add --no-cache openssl
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
# Generated Prisma client + query engine (built on the same alpine base).
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node package.json ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1
CMD ["node", "dist/index.js"]
