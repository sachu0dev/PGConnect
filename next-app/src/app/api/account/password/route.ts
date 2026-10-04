import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validation";
import { badRequest, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireUser } from "@/server/auth/guard";
import { revokeAllSessions, startSession } from "@/server/auth/session";
import { MINUTE, checkPassword, hashPassword, userAgentOf } from "../../auth/_lib/helpers";

/**
 * POST /api/account/password — change (or, for Google-only accounts, set) the password.
 * Body: { currentPassword?, newPassword }. Signs out other devices. Response: { accessToken }.
 */
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  enforceRateLimit(`account:password:${user.id}`, 5, 15 * MINUTE);
  const body = changePasswordSchema.parse(await readJson(req));

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
  if (record?.password) {
    if (!body.currentPassword) {
      throw badRequest("Enter your current password", { currentPassword: ["Current password is required"] });
    }
    if (!(await checkPassword(body.currentPassword, record.password))) {
      throw badRequest("Your current password is incorrect", {
        currentPassword: ["Your current password is incorrect"],
      });
    }
    if (body.currentPassword === body.newPassword) {
      throw badRequest("Choose a password different from your current one", {
        newPassword: ["New password must be different"],
      });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(body.newPassword), resetCode: null, resetCodeExpireAt: null },
  });
  await revokeAllSessions(user.id);
  const { accessToken } = await startSession(user.id, userAgentOf(req));
  return ok({ accessToken });
});
