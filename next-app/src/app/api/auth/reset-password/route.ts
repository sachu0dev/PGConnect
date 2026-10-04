import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";
import { badRequest, getClientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { revokeAllSessions } from "@/server/auth/session";
import { MINUTE, consumeCode, hashPassword, signIn } from "../_lib/helpers";

/**
 * POST /api/auth/reset-password — sets a new password using the emailed code,
 * signs out every device and starts a fresh session.
 * Body: { email, code, password }. Response: { accessToken, user }.
 */
export const POST = route(async (req: NextRequest) => {
  enforceRateLimit(`reset:ip:${getClientIp(req)}`, 20, 10 * MINUTE);
  const { email, code, password } = resetPasswordSchema.parse(await readJson(req));

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isBanned: true },
  });
  if (!user || user.isBanned) {
    throw badRequest("This code is no longer valid. Request a new one.", { needsResend: true });
  }

  await consumeCode(user.id, code, "reset");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(password),
      resetCode: null,
      resetCodeExpireAt: null,
      resetAttempts: 0,
      isVerified: true,
      verifyCode: null,
      verifyCodeExpireAt: null,
      verifyAttempts: 0,
    },
  });
  await revokeAllSessions(user.id);
  return ok(await signIn(user.id, req));
});
