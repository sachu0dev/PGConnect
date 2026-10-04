import { requireUser } from "@/server/auth/guard";
import { listUsers, queryObject, userListQuery } from "@/server/admin";
import { env } from "@/server/env";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, { admin: true });
  const query = userListQuery.parse(queryObject(req));
  return ok(await listUsers(query, env.adminEmails), { headers: { "cache-control": "no-store" } });
});
