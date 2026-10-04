import { legacyUpdateRoute } from "@/server/owner";

/** Legacy adapter: PUT { pgId, description }. Prefer PATCH /api/dashboard/pg/[id]. */
export const PUT = legacyUpdateRoute(["description"]);
