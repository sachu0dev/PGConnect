import { legacyUpdateRoute } from "@/server/owner";

/** Legacy adapter: PUT { pgId, rentPerMonth, deposit? }. Prefer PATCH /api/dashboard/pg/[id]. */
export const PUT = legacyUpdateRoute(["rentPerMonth", "deposit"]);
