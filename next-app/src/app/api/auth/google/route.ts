import { NextRequest } from "next/server";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { env, features } from "@/server/env";
import { ApiError, forbidden, getClientIp, ok, readJson, route, unauthorized } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { MINUTE, generateUniqueUsername, signIn } from "../_lib/helpers";

const bodySchema = z.object({ credential: z.string().min(20).max(8192) });

let client: OAuth2Client | null = null;

/**
 * POST /api/auth/google — signs in with a Google Identity Services ID token.
 * Links by Google id, then by verified email, else creates a new account.
 * Body: { credential }. Response: { accessToken, user }.
 */
export const POST = route(async (req: NextRequest) => {
  if (!features.googleAuth || !env.googleClientId) {
    throw new ApiError(503, "Google sign-in is not available right now. Please use email instead.");
  }
  enforceRateLimit(`google:ip:${getClientIp(req)}`, 20, 10 * MINUTE);
  const { credential } = bodySchema.parse(await readJson(req));

  client ??= new OAuth2Client(env.googleClientId);
  let payload: TokenPayload | undefined;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw unauthorized("Google sign-in failed. Please try again.");
  }
  if (!payload?.sub || !payload.email) throw unauthorized("Google sign-in failed. Please try again.");
  if (!payload.email_verified) {
    throw forbidden("Your Google email address is not verified. Please use email sign-up instead.");
  }

  const googleId = payload.sub;
  const email = payload.email.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { googleId },
    select: { id: true, isBanned: true },
  });

  if (!user) {
    const byEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isBanned: true, isVerified: true, googleId: true },
    });
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== googleId) {
        throw forbidden("This email is linked to a different Google account.");
      }
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId,
          isVerified: true,
          verifyCode: null,
          verifyCodeExpireAt: null,
          verifyAttempts: 0,
          // An unverified sign-up never proved ownership of this email, so a
          // password set by whoever started it must not survive the link.
          ...(byEmail.isVerified ? {} : { password: null }),
        },
        select: { id: true, isBanned: true },
      });
    } else {
      const username = await generateUniqueUsername(payload.name, payload.given_name, email.split("@")[0]);
      user = await prisma.user.create({
        data: { username, email, googleId, isVerified: true },
        select: { id: true, isBanned: true },
      });
    }
  }

  if (user.isBanned) throw forbidden("Your account has been suspended. Contact support.");
  return ok(await signIn(user.id, req));
});
