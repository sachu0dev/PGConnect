import { requireUser } from "@/server/auth/guard";
import { listVerifications, queryObject, verificationListQuery } from "@/server/admin";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, { admin: true });
  const query = verificationListQuery.parse(queryObject(req));
  return ok(await listVerifications(query), { headers: { "cache-control": "no-store" } });
});
