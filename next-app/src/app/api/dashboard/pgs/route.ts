import { requireUser } from "@/server/auth/guard";
import { ok, route } from "@/server/http";
import { getOwnerListings } from "@/server/owner";

export const dynamic = "force-dynamic";

/** The signed-in owner's listings with performance counters. */
export const GET = route(async (req) => {
  const user = await requireUser(req, { owner: true });
  return ok(await getOwnerListings(user.id));
});
