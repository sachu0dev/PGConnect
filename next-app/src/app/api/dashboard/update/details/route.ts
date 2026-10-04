import { legacyUpdateRoute } from "@/server/owner";

/** Legacy adapter: PUT { pgId, contact, capacity, capacityCount, gender }. Prefer PATCH /api/dashboard/pg/[id]. */
export const PUT = legacyUpdateRoute(["contact", "capacity", "capacityCount", "gender"]);
