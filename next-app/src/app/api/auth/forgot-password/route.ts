import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { emailOnlySchema } from "@/lib/validation";
import { getClientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { MINUTE, issueCode } from "../_lib/helpers";

/**
 * POST /api/auth/forgot-password — emails a reset code if the account exists.
 * Always responds generically. Body: { email }. Response: { email }.
 */
export const POST = route(async (req: NextRequest) => {
  enforceRateLimit(`forgot:ip:${getClientIp(req)}`, 5, 10 * MINUTE);
  const { email } = emailOnlySchema.parse(await readJson(req));
  enforceRateLimit(`forgot:email:min:${email}`, 1, MINUTE);
  enforceRateLimit(`forgot:email:hour:${email}`, 5, 60 * MINUTE);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, isBanned: true },
  });
  if (user && !user.isBanned) {
    await issueCode(user, "reset");
  }
  return ok({ email });
});
