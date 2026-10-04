import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { ApiError, forbidden, getClientIp, ok, readJson, route, unauthorized } from "@/server/http";
import { checkRateLimit, enforceRateLimit } from "@/server/rate-limit";
import { MINUTE, checkPassword, issueCode, signIn } from "../_lib/helpers";

const INVALID = "Invalid email or password";

/**
 * POST /api/auth/login — email + password sign-in.
 * Body: { email, password }. Response: { accessToken, user }.
 * 403 with details { needsVerification, email } when the email is unverified.
 */
export const POST = route(async (req: NextRequest) => {
  const ip = getClientIp(req);
  enforceRateLimit(`login:ip:${ip}`, 50, 15 * MINUTE);
  const { email, password } = loginSchema.parse(await readJson(req));
  enforceRateLimit(`login:${ip}:${email}`, 10, 15 * MINUTE);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, password: true, isVerified: true, isBanned: true },
  });

  const valid = await checkPassword(password, user?.password);
  if (!user || !valid) throw unauthorized(INVALID);

  if (user.isBanned) throw forbidden("Your account has been suspended. Contact support.");

  if (!user.isVerified) {
    // Re-send a fresh code, but never more than once a minute per email.
    if (
      checkRateLimit(`resend:email:min:${email}`, 1, MINUTE).allowed &&
      checkRateLimit(`resend:email:hour:${email}`, 5, 60 * MINUTE).allowed
    ) {
      await issueCode(user, "verify");
    }
    throw new ApiError(403, "Please verify your email", { needsVerification: true, email: user.email });
  }

  return ok(await signIn(user.id, req));
});
