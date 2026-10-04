import "server-only";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { env } from "../env";
import {
  generateRefreshToken,
  hashToken,
  REFRESH_COOKIE,
  REFRESH_TOKEN_TTL_MS,
  signAccessToken,
} from "./tokens";

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax" as const,
  path: "/",
};

/** Creates a DB-backed session and sets the httpOnly refresh cookie. */
export async function startSession(userId: string, userAgent?: string | null) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      userAgent: userAgent?.slice(0, 255) ?? null,
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(REFRESH_COOKIE, refreshToken, { ...cookieOptions, expires: expiresAt });

  return { accessToken: signAccessToken(userId) };
}

/**
 * Validates the refresh cookie, slides the session expiry and returns a new
 * access token. Returns null when the session is missing, expired or revoked.
 */
export async function refreshSession() {
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, isBanned: true } } },
  });

  if (!session || session.expiresAt <= new Date() || session.user.isBanned) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    store.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return null;
  }

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date(), expiresAt },
  });
  store.set(REFRESH_COOKIE, token, { ...cookieOptions, expires: expiresAt });

  return { accessToken: signAccessToken(session.userId), userId: session.userId };
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

/** Revokes every session of a user (password change/reset, ban, deletion). */
export async function revokeAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
