import { requireUser, loadAuthUser } from "@/server/auth/guard";
import { toPublicUser } from "@/server/auth/public-user";
import { ok, route, unauthorized } from "@/server/http";
import { makeOwner } from "@/server/owner";

/** Turns the signed-in user into an owner (idempotent). */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  if (!user.isOwner) await makeOwner(user.id);
  const fresh = await loadAuthUser(user.id);
  if (!fresh) throw unauthorized();
  return ok(toPublicUser(fresh));
});
