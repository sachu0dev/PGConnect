import { requireUser } from "@/server/auth/guard";
import { ok, route } from "@/server/http";
import { getOwnerOverview } from "@/server/owner";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(req, { owner: true });
  return ok(await getOwnerOverview(user));
});
