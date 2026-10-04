import { route, ok } from "@/server/http";
import { searchListings } from "@/server/listings";
import { searchSchema } from "@/lib/validation";

/** Public listing search. Query params follow `searchSchema`. */
export const GET = route(async (req) => {
  const params = searchSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const result = await searchListings(params);
  return ok(result, {
    headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
});
