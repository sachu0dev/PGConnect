import "server-only";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../env";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE = "refreshToken";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
    }) as AccessTokenPayload;
    return typeof payload.userId === "string" ? payload : null;
  } catch {
    return null;
  }
}

/** Opaque refresh tokens: random bytes, only a SHA-256 hash is stored. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
