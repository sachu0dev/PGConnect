import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { ApiError, conflict, getClientIp, ok, readJson, route } from "@/server/http";
import { checkRateLimit, enforceRateLimit } from "@/server/rate-limit";
import { MINUTE, findUsernameOwner, hashPassword, issueCode } from "../_lib/helpers";

/**
 * POST /api/auth/signup — creates (or refreshes) an unverified account and
 * emails a 6-digit verification code. Body: { username, email, phoneNumber?, password }.
 * Response: { email }.
 */
export const POST = route(async (req: NextRequest) => {
  enforceRateLimit(`signup:ip:${getClientIp(req)}`, 5, 10 * MINUTE);
  const body = registerSchema.parse(await readJson(req));
  enforceRateLimit(`signup:email:${body.email}`, 5, 60 * MINUTE);

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true, isVerified: true, isBanned: true },
  });
  if (existing?.isVerified || existing?.isBanned) {
    throw conflict("An account with this email already exists — log in instead");
  }

  const usernameOwner = await findUsernameOwner(body.username);
  if (usernameOwner && usernameOwner.id !== existing?.id) {
    throw new ApiError(409, "This username is already taken. Try another one.", {
      username: ["This username is already taken"],
    });
  }

  const data = {
    username: body.username,
    password: await hashPassword(body.password),
    phoneNumber: body.phoneNumber ?? null,
  };
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data,
        select: { id: true, email: true, username: true },
      })
    : await prisma.user.create({
        data: { ...data, email: body.email },
        select: { id: true, email: true, username: true },
      });

  const sent = await issueCode(user, "verify");
  // Counts towards the resend cooldown so an immediate login doesn't email another code.
  checkRateLimit(`resend:email:min:${user.email}`, 1, MINUTE);
  if (!sent.success) {
    throw new ApiError(
      503,
      "We couldn't send the verification email right now. Please try again in a minute."
    );
  }
  return ok({ email: user.email }, 201);
});
