import { requireUser } from "@/server/auth/guard";
import { revokeAllSessions } from "@/server/auth/session";
import { findUserForAdmin, idParam, setUserBanned, toAdminUser, userBanSchema } from "@/server/admin";
import { env } from "@/server/env";
import { badRequest, forbidden, notFound, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireUser(req, { admin: true });
  enforceRateLimit(`admin:user:${admin.id}`, 60, 60_000);
  const id = idParam.parse((await params).id);
  const { isBanned } = userBanSchema.parse(await readJson(req));

  if (id === admin.id) throw badRequest("You cannot change the ban status of your own account");

  const target = await findUserForAdmin(id);
  if (!target) throw notFound("User not found");
  if (toAdminUser(target, env.adminEmails).isAdmin) throw forbidden("Admins cannot be banned");

  const updated = await setUserBanned(id, isBanned);
  // Banned users are signed out everywhere; their listings drop out of search automatically.
  if (isBanned) await revokeAllSessions(id);

  return ok(toAdminUser(updated, env.adminEmails));
});
