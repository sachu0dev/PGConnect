import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * Verifies a next-app access token (HS256, payload `{ userId }`).
 * Returns the user id, or null for any invalid / expired token.
 */
export function verifyAccessToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    if (typeof payload === "object" && payload !== null && typeof payload.userId === "string") {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}
