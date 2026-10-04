import { requireUser } from "@/server/auth/guard";
import { currentSubscription } from "@/server/billing";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Active (or recently started) subscription + current membership. */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  return ok(await currentSubscription(user));
});
