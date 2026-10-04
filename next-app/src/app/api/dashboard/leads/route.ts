import { requireUser } from "@/server/auth/guard";
import { ok, route } from "@/server/http";
import { getOwnerLeads, leadsQuerySchema } from "@/server/owner";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(req, { owner: true });
  const query = leadsQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return ok(await getOwnerLeads(user.id, query));
});
