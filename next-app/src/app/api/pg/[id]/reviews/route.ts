import { z } from "zod";
import { route, ok, readJson, badRequest, forbidden, notFound } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import { enforceRateLimit } from "@/server/rate-limit";
import { getPgAccess, getReviewPage, hasEngagement, requireInteractablePg } from "@/server/engagement";
import { refreshRating } from "@/server/listings";
import { reviewSchema } from "@/lib/validation";
import prisma from "@/lib/prisma";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

/** Public, paginated reviews (newest first) with a rating summary. */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const { page } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const pg = await requireInteractablePg(id);
  const data = await getReviewPage(pg.id, page);
  return ok(data, { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" } });
});

/** Create or update the signed-in user's review. Only for users who chatted or enquired. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  enforceRateLimit(`review:${user.id}`, 10, 60 * 60 * 1000);
  const input = reviewSchema.parse(await readJson(req));

  const pg = await requireInteractablePg(id);
  if (pg.ownerId === user.id) throw badRequest("You cannot review your own PG");
  if (!(await hasEngagement(user.id, pg.id))) {
    throw forbidden("You can review a PG after chatting with the owner or requesting a callback or visit.");
  }

  const review = await prisma.review.upsert({
    where: { pgId_userId: { pgId: pg.id, userId: user.id } },
    create: { pgId: pg.id, userId: user.id, rating: input.rating, comment: input.comment },
    update: { rating: input.rating, comment: input.comment },
    select: { id: true, rating: true, comment: true, createdAt: true, updatedAt: true },
  });
  await refreshRating(pg.id);
  return ok({ review });
});

/** Delete the signed-in user's own review. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  enforceRateLimit(`review:${user.id}`, 10, 60 * 60 * 1000);
  const pg = await getPgAccess(id);
  if (!pg) throw notFound("PG not found");
  const { count } = await prisma.review.deleteMany({ where: { pgId: pg.id, userId: user.id } });
  if (count === 0) throw notFound("You have not reviewed this PG");
  await refreshRating(pg.id);
  return ok({ deleted: true });
});
