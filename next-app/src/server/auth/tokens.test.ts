import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  generateOtp,
  generateRefreshToken,
  hashToken,
  safeEqual,
  signAccessToken,
  verifyAccessToken,
} from "./tokens";

afterEach(() => {
  vi.useRealTimers();
});

describe("access tokens", () => {
  it("round-trips the user id", () => {
    const token = signAccessToken("user-123");
    const payload = verifyAccessToken(token);
    expect(payload?.userId).toBe("user-123");
    expect(payload!.exp! - payload!.iat!).toBe(ACCESS_TOKEN_TTL_SECONDS);
  });

  it("rejects tampered tokens", () => {
    const token = signAccessToken("user-123");
    const [h, , s] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ userId: "admin" })).toString("base64url");
    expect(verifyAccessToken(`${h}.${forgedBody}.${s}`)).toBeNull();
    expect(verifyAccessToken("not-a-token")).toBeNull();
  });

  it("rejects tokens signed with another secret or algorithm", () => {
    expect(verifyAccessToken(jwt.sign({ userId: "x" }, "some-other-secret"))).toBeNull();
    expect(verifyAccessToken(jwt.sign({ userId: "x" }, "", { algorithm: "none" }))).toBeNull();
  });

  it("rejects tokens without a string userId", () => {
    expect(verifyAccessToken(jwt.sign({ sub: "x" }, "dev-insecure-jwt-secret-change-me"))).toBeNull();
  });

  it("expires after the TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
    const token = signAccessToken("user-123");
    vi.setSystemTime(new Date(Date.now() + (ACCESS_TOKEN_TTL_SECONDS + 5) * 1000));
    expect(verifyAccessToken(token)).toBeNull();
  });
});

describe("helpers", () => {
  it("compares strings in constant time semantics", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });

  it("generates 6-digit OTPs", () => {
    for (let i = 0; i < 500; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp[0]).not.toBe("0");
    }
  });

  it("generates unique url-safe refresh tokens and stable hashes", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(hashToken(a)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(hashToken(b));
  });
});
