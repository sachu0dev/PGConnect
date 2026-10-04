import { legacyUpdateRoute } from "@/server/owner";

/** Legacy adapter: PUT { pgId, address, city, locality? }. Prefer PATCH /api/dashboard/pg/[id]. */
export const PUT = legacyUpdateRoute(["address", "city", "locality", "latitude", "longitude"]);
