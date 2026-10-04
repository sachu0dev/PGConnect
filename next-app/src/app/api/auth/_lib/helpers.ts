import "server-only";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { env } from "@/server/env";
import { ApiError, unauthorized } from "@/server/http";
import { loadAuthUser } from "@/server/auth/guard";
import { toPublicUser } from "@/server/auth/public-user";
import { startSession } from "@/server/auth/session";
import { generateOtp, hashToken, safeEqual } from "@/server/auth/tokens";
import { sendEmail } from "@/server/email/send";
import { OtpEmail } from "@/server/email/templates";
import type { AuthResponse } from "@/lib/types";

export const BCRYPT_COST = 12;
export const OTP_TTL_MS = 15 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
export const MINUTE = 60 * 1000;

/** A valid bcrypt hash (cost 12) used to equalise timing when no user exists. */
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.Gx7HhZ3jJjDLsQmVwEKX9xgzK9yq";

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Compares a password against a hash, or burns equivalent time when there is no hash. */
export async function checkPassword(password: string, hash: string | null | undefined) {
  if (!hash) {
    await bcrypt.compare(password, DUMMY_HASH).catch(() => false);
    return false;
  }
  return bcrypt.compare(password, hash).catch(() => false);
}

export function userAgentOf(req: Request) {
  return req.headers.get("user-agent");
}

/** Starts a session for the user and returns the standard `{ accessToken, user }` payload. */
export async function signIn(userId: string, req: Request): Promise<AuthResponse> {
  const user = await loadAuthUser(userId);
  if (!user) throw unauthorized();
  const { accessToken } = await startSession(userId, userAgentOf(req));
  return { accessToken, user: toPublicUser(user) };
}

type CodePurpose = "verify" | "reset";

/** Generates a fresh OTP, stores only its hash and emails it to the user. */
export async function issueCode(
  user: { id: string; email: string; username: string },
  purpose: CodePurpose
) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.user.update({
    where: { id: user.id },
    data:
      purpose === "verify"
        ? { verifyCode: hashToken(code), verifyCodeExpireAt: expiresAt, verifyAttempts: 0 }
        : { resetCode: hashToken(code), resetCodeExpireAt: expiresAt, resetAttempts: 0 },
  });
  const subject =
    purpose === "verify"
      ? `${code} is your PGConnect verification code`
      : `${code} is your PGConnect password reset code`;
  return sendEmail(
    user.email,
    subject,
    OtpEmail({ username: user.username, code, purpose }),
    env.isProd ? undefined : `purpose=${purpose} code=${code}`
  );
}

/**
 * Consumes one attempt of a stored OTP and checks it. Attempts are counted in
 * the database (incremented before comparing) so parallel guesses cannot
 * exceed the limit. Throws a user-facing ApiError on any failure.
 */
export async function consumeCode(userId: string, code: string, purpose: CodePurpose) {
  const isVerify = purpose === "verify";
  const counted = isVerify
    ? await prisma.user.updateMany({
        where: { id: userId, verifyAttempts: { lt: MAX_CODE_ATTEMPTS }, verifyCode: { not: null } },
        data: { verifyAttempts: { increment: 1 } },
      })
    : await prisma.user.updateMany({
        where: { id: userId, resetAttempts: { lt: MAX_CODE_ATTEMPTS }, resetCode: { not: null } },
        data: { resetAttempts: { increment: 1 } },
      });

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      verifyCode: true,
      verifyCodeExpireAt: true,
      verifyAttempts: true,
      resetCode: true,
      resetCodeExpireAt: true,
      resetAttempts: true,
    },
  });
  const stored = isVerify ? row?.verifyCode : row?.resetCode;
  const expiresAt = isVerify ? row?.verifyCodeExpireAt : row?.resetCodeExpireAt;
  const attempts = (isVerify ? row?.verifyAttempts : row?.resetAttempts) ?? MAX_CODE_ATTEMPTS;

  if (!stored) {
    throw new ApiError(400, "This code is no longer valid. Request a new one.", { needsResend: true });
  }
  if (counted.count === 0) {
    throw new ApiError(429, "Too many incorrect attempts. Request a new code.", { needsResend: true });
  }
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, "This code has expired. Request a new one.", { needsResend: true });
  }
  if (!safeEqual(hashToken(code), stored)) {
    const left = Math.max(0, MAX_CODE_ATTEMPTS - attempts);
    throw new ApiError(
      400,
      left > 0
        ? `Incorrect code. ${left} ${left === 1 ? "attempt" : "attempts"} left.`
        : "Incorrect code. Request a new one.",
      { code: ["Incorrect code"], ...(left === 0 ? { needsResend: true } : {}) }
    );
  }
}

/** Case-insensitive username lookup (the DB constraint itself is case-sensitive). */
export async function findUsernameOwner(username: string) {
  return prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
}

function sanitizeUsername(raw: string) {
  const cleaned = raw
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\s.-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 18);
  return cleaned.length >= 3 ? cleaned : `user${cleaned}`.slice(0, 18).padEnd(4, "0");
}

const randomDigits = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

/** Derives an available username (3–24 chars of [a-z0-9_]) from a name or email. */
export async function generateUniqueUsername(...candidates: (string | null | undefined)[]) {
  const base = sanitizeUsername(candidates.find((c) => c && c.trim()) ?? "user");
  if (!(await findUsernameOwner(base))) return base;
  for (let i = 0; i < 8; i++) {
    const candidate = `${base}_${randomDigits(i < 4 ? 3 : 5)}`.slice(0, 24);
    if (!(await findUsernameOwner(candidate))) return candidate;
  }
  return `user_${randomDigits(10)}`;
}
