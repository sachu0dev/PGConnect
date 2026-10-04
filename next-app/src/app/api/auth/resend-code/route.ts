import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { emailOnlySchema } from "@/lib/validation";
import { getClientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { MINUTE, issueCode } from "../_lib/helpers";

/**
 * POST /api/auth/resend-code — emails a fresh verification code to an
 * unverified account. Always responds generically. Body: { email }.
 */
export const POST = route(async (req: NextRequest) => {
  enforceRateLimit(`resend:ip:${getClientIp(req)}`, 10, 10 * MINUTE);
  const { email } = emailOnlySchema.parse(await readJson(req));
  enforceRateLimit(`resend:email:min:${email}`, 1, MINUTE);
  enforceRateLimit(`resend:email:hour:${email}`, 5, 60 * MINUTE);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, isVerified: true, isBanned: true },
  });
  if (user && !user.isVerified && !user.isBanned) {
    await issueCode(user, "verify");
  }
  return ok({ message: "If this email is awaiting verification, a new code is on its way." });
});
