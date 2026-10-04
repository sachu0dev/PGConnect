import { requireUser } from "@/server/auth/guard";
import { inboxQuerySchema, listInbox } from "@/server/chat-queries";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Inbox: every conversation where the user is the tenant or the PG owner. */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  const query = inboxQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const page = await listInbox(user.id, query);
  return ok(page, { headers: { "cache-control": "no-store" } });
});
