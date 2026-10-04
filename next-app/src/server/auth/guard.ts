import "server-only";
import prisma from "@/lib/prisma";
import { env } from "../env";
import { forbidden, unauthorized } from "../http";
import { verifyAccessToken } from "./tokens";

export const authUserSelect = {
  id: true,
  username: true,
  email: true,
  phoneNumber: true,
  isOwner: true,
  isAdmin: true,
  isBanned: true,
  isVerified: true,
  membership: true,
  googleId: true,
  password: true,
  createdAt: true,
  verification: { select: { status: true } },
} as const;

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isVerified: boolean;
  membership: "FREE" | "BASIC" | "PREMIUM";
  hasPassword: boolean;
  hasGoogle: boolean;
  ownerVerification: "PENDING" | "APPROVED" | "REJECTED" | null;
  createdAt: Date;
};

export function getTokenUserId(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyAccessToken(header.slice(7))?.userId ?? null;
}

export async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: authUserSelect });
  if (!user) return null;
  const { password, googleId, verification, ...rest } = user;
  return {
    ...rest,
    isAdmin: user.isAdmin || env.adminEmails.includes(user.email.toLowerCase()),
    hasPassword: Boolean(password),
    hasGoogle: Boolean(googleId),
    ownerVerification: verification?.status ?? null,
  };
}

type GuardOptions = { owner?: boolean; admin?: boolean };

export async function requireUser(req: Request, options: GuardOptions = {}): Promise<AuthUser> {
  const userId = getTokenUserId(req);
  if (!userId) throw unauthorized();

  const user = await loadAuthUser(userId);
  if (!user) throw unauthorized();
  if (user.isBanned) throw forbidden("Your account has been suspended. Contact support.");
  if (options.admin && !user.isAdmin) throw forbidden();
  if (options.owner && !user.isOwner && !user.isAdmin) {
    throw forbidden("Switch to an owner account to manage listings.");
  }
  return user;
}

export async function optionalUser(req: Request): Promise<AuthUser | null> {
  const userId = getTokenUserId(req);
  if (!userId) return null;
  const user = await loadAuthUser(userId);
  return user && !user.isBanned ? user : null;
}
