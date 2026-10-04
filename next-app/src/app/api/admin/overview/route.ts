import { requireUser } from "@/server/auth/guard";
import { getAdminOverview } from "@/server/admin";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, { admin: true });
  return ok(await getAdminOverview(), { headers: { "cache-control": "no-store" } });
});
