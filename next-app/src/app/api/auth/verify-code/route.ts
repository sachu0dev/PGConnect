import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCodeSchema } from "@/lib/validation";
import { badRequest, forbidden, getClientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { MINUTE, consumeCode, signIn } from "../_lib/helpers";

/**
 * POST /api/auth/verify-code — confirms the email OTP and signs the user in.
 * Body: { email, code }. Response: { accessToken, user }.
 */
export const POST = route(async (req: NextRequest) => {
  enforceRateLimit(`verify:ip:${getClientIp(req)}`, 30, 10 * MINUTE);
  const { email, code } = verifyCodeSchema.parse(await readJson(req));

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isVerified: true, isBanned: true },
  });
  if (!user) throw badRequest("This code is no longer valid. Request a new one.", { needsResend: true });
  if (user.isVerified) throw badRequest("This email is already verified. Please log in.", { alreadyVerified: true });
  if (user.isBanned) throw forbidden("Your account has been suspended. Contact support.");

  await consumeCode(user.id, code, "verify");

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyCode: null, verifyCodeExpireAt: null, verifyAttempts: 0 },
  });
  return ok(await signIn(user.id, req));
});
