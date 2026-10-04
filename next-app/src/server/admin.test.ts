import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));

const {
  listingListQuery,
  reportDecisionSchema,
  toAdminUser,
  userListQuery,
  verificationDecisionSchema,
  verificationListQuery,
} = await import("./admin");

describe("admin input schemas", () => {
  it("requires a note when rejecting a verification", () => {
    expect(verificationDecisionSchema.safeParse({ status: "REJECTED" }).success).toBe(false);
    expect(verificationDecisionSchema.safeParse({ status: "REJECTED", note: "   " }).success).toBe(false);
    expect(verificationDecisionSchema.parse({ status: "REJECTED", note: " Blurry photo " }).note).toBe("Blurry photo");
    expect(verificationDecisionSchema.parse({ status: "APPROVED" }).note).toBeNull();
  });

  it("defaults list queries", () => {
    expect(verificationListQuery.parse({})).toEqual({ status: "PENDING", page: 1 });
    expect(userListQuery.parse({ q: "  ", page: "2" })).toEqual({ q: undefined, page: 2 });
    expect(listingListQuery.safeParse({ status: "DELETED" }).success).toBe(false);
  });

  it("defaults blockListing to false", () => {
    expect(reportDecisionSchema.parse({ status: "DISMISSED" })).toEqual({ status: "DISMISSED", blockListing: false });
    expect(reportDecisionSchema.safeParse({ status: "OPEN" }).success).toBe(false);
  });
});

describe("toAdminUser", () => {
  const row = {
    id: "u1",
    username: "ravi",
    email: "Ravi@Example.com",
    isOwner: true,
    isAdmin: false,
    isBanned: false,
    isVerified: true,
    membership: "BASIC" as const,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    _count: { Pg: 3 },
  };

  it("treats ADMIN_EMAILS members as admins (case-insensitive)", () => {
    expect(toAdminUser(row, ["ravi@example.com"]).isAdmin).toBe(true);
    expect(toAdminUser(row, []).isAdmin).toBe(false);
  });

  it("flattens counts and serialises dates", () => {
    expect(toAdminUser(row, [])).toMatchObject({ listingCount: 3, createdAt: "2026-01-01T00:00:00.000Z" });
  });
});

describe("parseId", () => {
  it("passes UUIDs through and 404s anything else", async () => {
    const { parseId } = await import("./admin");
    expect(parseId("3f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f")).toBe("3f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f");
    expect(() => parseId("../etc/passwd", "User")).toThrowError("User not found");
  });
});
