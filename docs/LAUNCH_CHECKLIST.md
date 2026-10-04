# PGConnect launch checklist

Tick everything before pointing the domain at production. Details for each step are in the
[README deployment guide](../README.md#deployment-guide).

## 1. Configuration
- [ ] All required env vars set in production (compare with `next-app/.env.example`): `DATABASE_URL`, `JWT_SECRET`
      (48+ random bytes, same on socket server), `NEXT_PUBLIC_SITE_URL`, AWS, Resend, Razorpay.
- [ ] `ADMIN_EMAILS` contains at least two team members; log in and open `/admin`.
- [ ] `SOCKET_INTERNAL_SECRET` set on both services; `NEXT_PUBLIC_SOCKET_URL` uses `wss://`/`https://`.
- [ ] Policy pages reviewed and the `[Merchant legal entity name]` / `[Registered address]` placeholders on `/contact`
      replaced with the real details (Razorpay checks these).
- [ ] `SUPPORT_EMAIL` in `src/lib/constants.ts` is a monitored inbox.

## 2. Database
- [ ] Managed Postgres with daily backups + point-in-time recovery enabled; restore tested once.
- [ ] `yarn db:migrate` run against production; **do not** run `db:seed` in production.
- [ ] `GET /api/health` returns `{"ok":true,"db":"up"}`.

## 3. Storage (S3)
- [ ] Bucket policy allows public `GetObject` **only** on `pg-images/*`; Block Public Access protects `private/*`.
- [ ] Verified: a `private/verification/...` URL returns 403 when opened directly.
- [ ] IAM user limited to Put/Get/Delete on this bucket; lifecycle rule expires `private/verification/*` after 90 days.

## 4. Payments (Razorpay)
- [ ] Live keys + live plan IDs (Growth ₹499, Pro ₹4,999) configured.
- [ ] Webhook `https://<domain>/api/webhooks/razorpay` with secret and events `subscription.activated`, `.charged`,
      `.halted`, `.cancelled`, `.completed`; delivery shows 200 in the dashboard.
- [ ] One real ₹499 subscription purchased, plan activated, then cancelled from `/membership` and refunded.

## 5. Email, auth & maps
- [ ] Resend domain verified (SPF, DKIM, DMARC); OTP email lands in Gmail inbox, not spam.
- [ ] Google OAuth: production origin added to Authorized JavaScript origins; Google sign-in works.
- [ ] Maps key restricted to production referrers; map + place search work on `/pgs` and Post PG.

## 6. SEO
- [ ] Search Console verified (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`), `sitemap.xml` submitted.
- [ ] `robots.txt` allows public pages; `/admin`, `/dashboard`, `/account`, `/chat` are not indexed.
- [ ] Spot-check titles, canonical URLs and Open Graph previews (share a listing on WhatsApp).

## 7. Smoke tests (on a phone, 4G)
- [ ] Sign up with email OTP → verify → log out → log in → reset password.
- [ ] Search a city with filters, open a listing, shortlist, reveal phone, request a callback and a visit.
- [ ] Owner: become owner → post a PG with photos → edit → pause/resume → see leads → reply in chat (realtime).
- [ ] Owner ID verification → admin approves → badge shows on listing; rejection email received.
- [ ] Report a listing → admin resolves with block → listing disappears from search.
- [ ] Admin bans a test user → that user is signed out everywhere.
- [ ] Delete a test account from Account settings.
- [ ] 404 page, error page, and all five policy pages render; dark mode looks right.

## 8. Monitoring & operations
- [ ] Uptime monitor on `/api/health` (web) and `/health` (socket) with alerts to the team.
- [ ] Error logs from the host (Vercel/Render) reviewed daily in launch week; alerts on 5xx spikes.
- [ ] Database backups verified; S3 versioning on for `pg-images/`.
- [ ] Moderation rota: verifications and reports cleared at least twice a day.

---

## Go-to-market (first 90 days)

1. **Seed supply city by city.** Start with 1–2 cities where demand is dense and predictable — e.g. Bengaluru
   (Koramangala, HSR, Whitefield) and Pune (Hinjewadi) for IT freshers, or Delhi North Campus / Kota for students.
   Aim for 50–100 real, verified listings per micro-market before marketing to tenants.
2. **Onboard owners free and by hand.** Walk the lanes near colleges and IT parks, list the PG for the owner on the
   spot (photos from their phone), and verify them. Keep everyone on the free plan until leads flow; upsell Growth
   once an owner gets 5+ enquiries a month.
3. **WhatsApp first.** Make every listing easy to share to WhatsApp groups (college batches, company new-joiner
   groups, flat-hunting groups); give owners a ready message + link to post in their own groups.
4. **SEO city pages.** Publish `/pg-in/<city>` and locality pages early, link them from the footer, and fill them with
   real listings and short local guides ("PGs near Christ University", "PG in Hinjewadi Phase 1 under ₹10k").
5. **Trust is the product.** Verified badges, real photos, honest pricing and fast action on reports. Remove fake
   listings within 24 hours and say so publicly.
6. **Referrals.** Give owners one month of Growth free for every owner they refer who lists a verified PG; give
   tenants a small reward (e.g. a food voucher) when a friend they referred moves in.
7. **Measure weekly.** Listings live, verified-owner share, searches → enquiries rate, owner response time, and
   enquiries per listing per city. Double down on micro-markets where enquiries per listing grow.
