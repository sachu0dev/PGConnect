import { requireUser } from "@/server/auth/guard";
import { listingListQuery, listListings, queryObject } from "@/server/admin";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, { admin: true });
  const query = listingListQuery.parse(queryObject(req));
  return ok(await listListings(query), { headers: { "cache-control": "no-store" } });
});
