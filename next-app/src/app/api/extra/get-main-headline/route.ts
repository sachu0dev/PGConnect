import { route, ok } from "@/server/http";
import { getPlatformStats } from "@/server/listings";

/** Platform-wide live numbers: active listings, cities and beds. */
export const GET = route(async () => {
  const stats = await getPlatformStats();
  return ok(stats, {
    headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=900" },
  });
});
