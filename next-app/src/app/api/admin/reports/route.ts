import { requireUser } from "@/server/auth/guard";
import { listReports, queryObject, reportListQuery } from "@/server/admin";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, { admin: true });
  const query = reportListQuery.parse(queryObject(req));
  return ok(await listReports(query), { headers: { "cache-control": "no-store" } });
});
