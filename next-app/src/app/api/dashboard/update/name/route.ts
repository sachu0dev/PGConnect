import { legacyUpdateRoute } from "@/server/owner";

/** Legacy adapter: PUT { pgId, name }. Prefer PATCH /api/dashboard/pg/[id]. */
export const PUT = legacyUpdateRoute(["name"]);
