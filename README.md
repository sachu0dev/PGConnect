# PGConnect

**PGConnect** is a paying-guest (PG) and co-living rental marketplace for India. Tenants search verified PGs by
city, locality or college, compare rent, deposit, food and sharing options, shortlist, chat with owners and request a
callback or a visit — with zero brokerage. Owners list PGs for free, manage leads and chats, get ID-verified and
upgrade to paid plans via Razorpay. Admins moderate listings, reports, users and owner verifications.

---

## Features

**Tenants**
- Search with URL-driven filters: city/locality/college, boys/girls/co-living, sharing type, budget, food, amenities,
  availability, verified owners, sort by price/rating/newest/distance; list + map view
- SEO city pages (`/pg-in/bengaluru`), listing pages with photo gallery, price breakdown, house rules, reviews
- Shortlist, request a callback or visit, reveal the owner's phone (signed-in), in-app chat with realtime updates
- Report fake/scam listings; reviews only from users who actually enquired or chatted
- Email OTP sign-up, Google sign-in, password reset, account deletion

**Owners**
- Post a PG with 3–10 photos, map pin, rent/deposit, sharing types, amenities, food, rules, notice period
- Dashboard: listings (pause/resume/edit/photos), leads (new → contacted → closed), chats, performance
- ID verification for a "Verified Owner" badge (private document storage)
- Plans: Starter (free, 1 listing), Growth and Pro monthly subscriptions via Razorpay

**Admins** (`/admin`)
- Overview with marketplace stats and queues
- Approve/reject owner verifications (private document viewer, rejection note emailed to the owner)
- Resolve/dismiss reports, optionally blocking the listing
- Search all listings and block/unblock; search users and ban/unban (bans revoke every session)

---

## Architecture

```
                    ┌──────────────────────────────────────────────┐
  Browser / PWA ───▶│ next-app  (Next.js 15 App Router, Node 22)   │
   │                │  • Server Components for SEO pages           │
   │                │  • REST API under /api/* (route() envelope)  │
   │                │  • JWT access token + httpOnly refresh cookie│
   │                └──────┬───────────┬───────────┬───────────────┘
   │                       │ Prisma    │ HTTPS     │ POST /internal/emit (shared secret)
   │                       ▼           ▼           ▼
   │               ┌────────────┐  ┌─────────┐  ┌──────────────────────┐
   │               │ PostgreSQL │  │ S3      │  │ socket-server        │
   │               │ (Neon /    │  │ images +│  │ (Socket.IO, Node 22) │
   │               │  Supabase) │  │ private │  │ rooms user:<id>,     │
   │               └────────────┘  │ ID docs │  │ chat:<id>            │
   │                     ▲         └─────────┘  └──────────┬───────────┘
   │                     └──────── Prisma (room auth) ─────┘
   └──────── WebSocket (JWT) ─────────────────────────────────▶ socket-server

  Third parties: Resend (email) · Razorpay (subscriptions + webhook) · Google (OAuth, Maps/Places)
```

- `next-app/` — web UI, REST API and database access. Business logic lives in `src/server/*`; shared validation
  in `src/lib/validation.ts`. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for conventions and the route map.
- `socket-server/` — optional realtime push for chat. Without it, chat falls back to polling.
- `docs/` — architecture notes and the [launch checklist](docs/LAUNCH_CHECKLIST.md).

### Tech stack

| Area | Choice |
|---|---|
| Web | Next.js 15 (App Router, standalone output), React 19, TypeScript (strict) |
| UI | Tailwind CSS, Radix UI primitives (shadcn-style), lucide icons, sonner toasts, next-themes |
| Data | PostgreSQL 16, Prisma 5 |
| Auth | Email OTP + password (bcrypt), Google Identity Services, short-lived JWT + rotating DB sessions |
| Files | AWS S3 (public `pg-images/*`, private `private/*` with signed URLs) |
| Email | Resend + React Email templates |
| Payments | Razorpay Subscriptions + webhooks |
| Realtime | Socket.IO server (Node 22) |
| Quality | ESLint, `tsc --noEmit`, Vitest, GitHub Actions |

---

## Local setup

Prerequisites: Node 22, Yarn 1.x, Docker (or a local PostgreSQL 16).

```bash
# 1. Postgres (or point DATABASE_URL at your own instance)
docker compose up -d db

# 2. Web app
cd next-app
cp .env.example .env          # set JWT_SECRET; everything else is optional locally
yarn install
yarn db:migrate               # prisma migrate deploy
yarn db:seed                  # demo users + 16 listings across 5 cities
yarn dev                      # http://localhost:3000

# 3. Realtime chat (optional, second terminal)
cd socket-server
cp .env.example .env          # same JWT_SECRET and SOCKET_INTERNAL_SECRET as next-app
yarn install
yarn dev                      # http://localhost:4000
```

Demo logins created by the seed (password `Password123`, development only):

| Email | Role |
|---|---|
| `owner@pgconnect.dev` | Verified owner on the Pro plan **and admin** (`/admin`) |
| `owner2@pgconnect.dev` | Growth-plan owner with a pending verification |
| `owner3@pgconnect.dev` | Free-plan owner |
| `tenant@pgconnect.dev` | Tenant with a shortlist, enquiries and a chat |

Without AWS/Resend/Razorpay keys the app still works locally: uploads go to `public/uploads` and
`.private-uploads`, emails (including OTP codes) are printed to the server log, and checkout is disabled.

To run the whole stack in containers (production-style, no bind mounts):

```bash
cp next-app/.env.example next-app/.env   # fill in secrets
docker compose up -d --build             # db + next-app (runs migrations) + socket-server
```

Build-time values (`NEXT_PUBLIC_*`, `AWS_BUCKET_NAME`, `AWS_REGION`, `AWS_PUBLIC_BASE_URL`) for the image are read
from your shell or a `.env` file next to `docker-compose.yml`.

---

## Environment variables

Full, commented list: [`next-app/.env.example`](next-app/.env.example) and `socket-server/.env.example`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes (prod) | Signs access tokens; must match the socket server |
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Canonical origin for SEO, sitemap and email links (build time) |
| `ADMIN_EMAILS` | recommended | Comma-separated emails with admin access |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME` | yes (prod) | S3 storage for photos and ID documents |
| `AWS_PUBLIC_BASE_URL` | no | CDN/custom domain in front of the bucket |
| `RESEND_API_KEY`, `EMAIL_FROM` | yes (prod) | Transactional email (OTP, leads, decisions) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID` | no | Sign in with Google |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | no | Maps and place autocomplete |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | no | Search Console verification meta tag |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | for payments | Razorpay API keys |
| `RAZORPAY_WEBHOOK_SECRET` | for payments | Verifies `/api/webhooks/razorpay` |
| `RAZORPAY_BASIC_PLAN_ID`, `RAZORPAY_PREMIUM_PLAN_ID` | for payments | Plan IDs for Growth / Pro |
| `NEXT_PUBLIC_SOCKET_URL` | no | Browser URL of the socket server |
| `SOCKET_INTERNAL_URL`, `SOCKET_INTERNAL_SECRET` | with socket server | Server-to-server push |
| `CLIENT_ORIGIN`, `PORT`, `LOG_LEVEL` | socket server | Allowed origins, port, log level |
| `RUN_MIGRATIONS` | Docker only | Run `prisma migrate deploy` on container start |
| `SEED_FORCE` | no | Allow `db:seed` with `NODE_ENV=production` (don't) |

---

## Deployment guide

A simple, low-cost production setup:

### 1. Database — Neon or Supabase (managed Postgres 16)
- Create a database in an Indian or nearby region (e.g. `ap-south-1` / Mumbai, or Singapore).
- Use the **pooled** connection string for `DATABASE_URL` on serverless hosts (add `?pgbouncer=true&connection_limit=1`
  for Prisma with PgBouncer) and enable daily backups / point-in-time recovery.
- Apply migrations: `cd next-app && DATABASE_URL=... yarn db:migrate` (Vercel's `vercel-build` script also runs it).

### 2. Web app — Vercel
- Import the repo, set **Root Directory** to `next-app`. Build command: `yarn vercel-build`.
- Add all environment variables (Production + Preview). Set `NEXT_PUBLIC_SITE_URL` to your domain.
- Attach your domain and force HTTPS. Health check: `GET /api/health` → `{ ok, db, time }`.
- Alternatively deploy the Docker image (`next-app/Dockerfile`) to any container host with `RUN_MIGRATIONS=true`.

### 3. Socket server — Render, Fly.io or Railway
- Deploy `socket-server/` with its Dockerfile (port 4000, health check `/health`).
- Env: `JWT_SECRET` (same as web), `SOCKET_INTERNAL_SECRET` (same as web), `DATABASE_URL`,
  `CLIENT_ORIGIN=https://your-domain`.
- On the web app set `NEXT_PUBLIC_SOCKET_URL` (public `wss://` URL) and `SOCKET_INTERNAL_URL`.

### 4. AWS S3
- Create a bucket in `ap-south-1`. Keep **Block Public Access** on for everything except listing photos by using a
  bucket policy that allows public reads **only** for `pg-images/*`:

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadListingPhotos",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::YOUR_BUCKET/pg-images/*"
      }
    ]
  }
  ```
  (Turn off only "Block public access granted through *new public bucket policies*" so this policy applies.)
- **Never** grant public access to `private/*` — ID documents are only served through 5-minute signed URLs to admins.
- Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::YOUR_BUCKET/*` only.
- Optional: put CloudFront in front of `pg-images/*` and set `AWS_PUBLIC_BASE_URL`.
- Add a lifecycle rule to expire `private/verification/*` objects after 90 days (matches the privacy policy).

### 5. Razorpay
- Create two monthly plans (Growth ₹499, Pro ₹4,999) and set `RAZORPAY_BASIC_PLAN_ID` / `RAZORPAY_PREMIUM_PLAN_ID`.
- Webhook URL: `https://your-domain/api/webhooks/razorpay` with a secret (`RAZORPAY_WEBHOOK_SECRET`), events:
  `subscription.activated`, `subscription.charged`, `subscription.halted`, `subscription.cancelled`,
  `subscription.completed`.
- Test end-to-end with test keys, then switch to live keys after KYC/website approval (the policy pages at `/terms`,
  `/privacy`, `/refund-policy`, `/shipping-policy` and `/contact` are what Razorpay reviews).

### 6. Resend
- Add and verify your sending domain (SPF, DKIM and a DMARC record in your DNS); set `EMAIL_FROM` on that domain.

### 7. Google
- OAuth client (Web): add `https://your-domain` (and `http://localhost:3000` for dev) to **Authorized JavaScript
  origins**. Set both `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`.
- Maps key: enable Maps JavaScript API + Places API, restrict by HTTP referrer to your domains.
- Search Console: verify the domain and submit `https://your-domain/sitemap.xml`.

---

## Security notes

- Access tokens live only in memory (15 min); refresh tokens are opaque, stored hashed, httpOnly + `SameSite=Lax`,
  revocable per session. Password change/reset, ban and account deletion revoke all sessions.
- Every API route validates input with zod and checks authorization (owner / participant / admin). Errors use a
  uniform `{ success, error }` envelope without stack traces.
- Rate limits on auth, OTP, enquiries, reports, chat and admin mutations (in-memory per instance; OTP attempts also
  counted in the database).
- Uploads are type-checked by magic bytes, size-limited and stored under server-generated keys; ID documents are
  private, encrypted at rest (SSE) and served via short-lived signed URLs with `Cache-Control: no-store`.
- Owner phone numbers are revealed only to signed-in users; tenants' numbers only to the owner they contact.
- Razorpay checkout and webhook signatures are verified with HMAC-SHA256 on the raw body (constant-time compare).
- Security headers (HSTS, nosniff, frame options, referrer policy, permissions policy) are set in `next.config.ts`.
- Admin pages are `noindex` and every admin endpoint re-checks `isAdmin` (or `ADMIN_EMAILS`).

---

## Scripts (`next-app/`)

| Script | What it does |
|---|---|
| `yarn dev` | Next.js dev server |
| `yarn build` / `yarn start` | Production build / server (`prisma generate` included) |
| `yarn lint` | ESLint (`next lint`) |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Vitest unit tests (`src/**/*.test.ts`) |
| `yarn db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `yarn db:migrate:dev` | Create a migration during development |
| `yarn db:seed` | Seed demo data (refuses in production unless `SEED_FORCE=true`) |
| `yarn vercel-build` | Generate client, migrate, build (used by Vercel) |

Socket server: `yarn dev`, `yarn build`, `yarn start`, `yarn typecheck`.

CI (`.github/workflows/ci.yml`) runs Prisma validate, migrations against a Postgres service, lint, type-check, tests,
the seed and a production build for the web app, plus type-check and build for the socket server.
