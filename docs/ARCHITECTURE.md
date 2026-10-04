# PGConnect — Architecture & Conventions

PGConnect is a two-sided marketplace for paying-guest (PG) / co-living rentals in India.
Tenants search, shortlist, chat and request callbacks/visits; owners list PGs, manage
leads and chats, get verified and upgrade plans; admins moderate.

```
next-app/        Next.js 15 (App Router) — web UI + REST API + Postgres via Prisma
socket-server/   Socket.IO realtime push (chat). Optional: chat falls back to polling.
docs/            This file, launch checklist
```

## Server conventions (next-app)

* Business logic lives in `src/server/*` (server-only). Route handlers stay thin.
* Every route handler is wrapped in `route()` from `@/server/http`:
  ```ts
  export const POST = route(async (req, { params }) => {
    const user = await requireUser(req);              // 401/403 handled
    const body = someSchema.parse(await readJson(req)); // ZodError -> 400
    if (!thing) throw notFound("PG not found");        // ApiError -> status
    return ok(data);                                    // { success: true, data }
  });
  ```
  Errors serialise as `{ success: false, error: string, details? }`.
* Auth: short-lived JWT access token (15 min) in memory on the client, sent as
  `Authorization: Bearer`. Opaque refresh token in an httpOnly cookie
  (`refreshToken`), stored hashed in the `Session` table (revocable).
  Use `requireUser(req, { owner?: true, admin?: true })` or `optionalUser(req)`.
* Validation schemas are shared client/server in `src/lib/validation.ts`.
* Rate limit sensitive endpoints with `enforceRateLimit(key, limit, windowMs)`
  (key usually includes `getClientIp(req)` or the user id).
* Never return other users' email/phone. A PG's `contact` phone is only revealed
  through `GET /api/pg/[id]/contact` to signed-in users.
* Files: `uploadListingImage`, `deleteListingImage` (only deletes URLs we issued),
  `uploadPrivateDocument` (ID docs, private), `getPrivateDocument` (admins).
  Without AWS env vars, dev falls back to `public/uploads` / `.private-uploads`.
* Email: `sendEmail(to, subject, <Template/>)`; logs instead of sending without
  `RESEND_API_KEY`.
* Realtime: `createMessage()` persists + calls `emitRealtime()` → socket server
  `POST /internal/emit` (shared secret). Rooms: `user:<id>`, `chat:<id>`.

## Client conventions

* `api<T>(path, { method, body, query })` from `@/lib/api-client` — unwraps the
  envelope, refreshes the token once on 401, throws `ApiClientError`.
  Use `errorMessage(err)` for toasts (`sonner`).
* `useAuth()` → `{ user, status: "loading"|"authenticated"|"guest", completeLogin, logout, reloadUser, setUser }`.
* `useRequireAuth({ owner?, admin? })` for protected client pages (middleware
  also redirects signed-out users away from `/dashboard`, `/account`, `/chat`, `/admin`).
* UI kit: `src/components/ui/*` (shadcn-style). Brand = `primary` (teal). Use
  `Button` (`loading` prop), `Badge`, `Input`, `Textarea`, `CheckboxChip`,
  `EmptyState`, `Spinner`, `Skeleton`, `Dialog`, `Select`, `DropdownMenu`.
* Prefer Server Components for public, SEO-relevant pages (home, search, PG
  detail, city pages) — query via `src/server/*` directly, no fetch to self.
* Mobile first. Every page must work at 360px width.

## Route map

### Public pages
| Path | Purpose |
|---|---|
| `/` | Home: search hero, popular cities, featured PGs, how it works, owner CTA, FAQ |
| `/pgs` | Search results (URL-driven filters, list + map) |
| `/pg-in/[city]` | SEO city landing page (same search UI, city preset) |
| `/pg/[id]` | Listing detail |
| `/owners` | "List your PG" landing + become-owner CTA |
| `/membership` | Plans & pricing + Razorpay checkout |
| `/login`, `/register`, `/verify?email=`, `/forgot-password`, `/reset-password?email=` | Auth |
| `/terms`, `/privacy`, `/refund-policy`, `/contact`, `/shipping-policy` | Policies (rewritten to legacy folders) |

### Signed-in pages
| Path | Purpose |
|---|---|
| `/account`, `/account/saved`, `/account/enquiries` | Profile/security, shortlist, sent callback/visit requests |
| `/chat`, `/chat/[id]` | Inbox + conversation (tenants and owners) |
| `/dashboard` … | Owner area: overview, `pgs`, `pgs/[id]`, `post-pg`, `leads`, `verify-owner` |
| `/admin` … | Admin: overview, verifications, reports, listings, users |

### API
| Method & path | Notes |
|---|---|
| `POST /api/auth/signup` `verify-code` `resend-code` `login` `google` `refresh` `logout` `forgot-password` `reset-password` | login/google/verify return `{ accessToken, user }` |
| `GET /api/profile` | current `PublicUser` |
| `PATCH/DELETE /api/account`, `POST /api/account/password`, `GET /api/account/favorites`, `GET /api/account/enquiries` | |
| `GET /api/get-pgs` | search (`searchSchema` query params) → `{ items: PgCard[], pagination }` |
| `GET /api/pg/get/[id]` | public listing detail |
| `GET /api/pg/[id]/me` | viewer state: saved, myReview, leads, chatId, canReview |
| `GET /api/pg/[id]/contact` | reveal owner phone (auth) |
| `POST/DELETE /api/pg/[id]/favorite` | shortlist |
| `GET/POST/DELETE /api/pg/[id]/reviews` | reviews (only users who chatted/enquired) |
| `POST /api/pg/[id]/report` | report listing |
| `POST /api/pg/[id]/leads` | callback / visit request (emails owner) |
| `POST /api/pg/[id]/chat` | get-or-create chat room → `{ chatId }` |
| `GET /api/chats`, `GET /api/chats/unread`, `GET /api/chats/[id]`, `GET/POST /api/chats/[id]/messages`, `POST /api/chats/[id]/read` | chat |
| `GET /api/city`, `GET /api/extra/get-main-headline` | cities with counts, platform stats |
| `POST /api/pg/post` | create listing (multipart) |
| `GET /api/dashboard/overview`, `GET /api/dashboard/pgs`, `GET/PATCH/DELETE /api/dashboard/pg/[id]`, `POST/PUT/DELETE /api/dashboard/update/image`, `GET /api/dashboard/leads`, `PATCH /api/dashboard/leads/[id]`, `POST /api/dashboard/become-owner` | owner |
| `GET/POST /api/auth/verify-owner` | owner ID verification status/submit |
| `POST /api/subscriptions/create` `verify` `cancel`, `GET /api/subscriptions/current`, `POST /api/webhooks/razorpay` | billing |
| `/api/admin/*` | moderation |
| `GET /api/health` | liveness + DB check |
