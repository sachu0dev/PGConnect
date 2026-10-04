import { route, ok } from "@/server/http";
import { getCityCounts } from "@/server/listings";
import { citySlug, titleCase } from "@/lib/format";

/** Cities that currently have active listings, most listings first. */
export const GET = route(async () => {
  const rows = await getCityCounts(100);
  const cities = rows.map((r) => ({
    city: r.city,
    label: titleCase(r.city),
    slug: citySlug(r.city),
    count: r.count,
  }));
  return ok(
    { cities },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
});
