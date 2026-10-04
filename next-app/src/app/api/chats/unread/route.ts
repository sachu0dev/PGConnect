import { requireUser } from "@/server/auth/guard";
import { unreadCountFor } from "@/server/chat";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  const count = await unreadCountFor(user.id);
  return ok({ count }, { headers: { "cache-control": "no-store" } });
});
