import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));

const { haversineKm, parsePlaceQuery } = await import("./listings");

describe("parsePlaceQuery", () => {
  it("splits Google Places style strings and drops pincode / country", () => {
    expect(parsePlaceQuery("Koramangala, Bengaluru, Karnataka 560034, India")).toEqual([
      "koramangala",
      "bengaluru",
      "karnataka",
    ]);
  });

  it("normalises whitespace and case", () => {
    expect(parsePlaceQuery("  HSR   Layout ,PUNE")).toEqual(["hsr layout", "pune"]);
  });

  it("ignores empty and one-letter parts", () => {
    expect(parsePlaceQuery(", , a, in, Bharat")).toEqual([]);
    expect(parsePlaceQuery("")).toEqual([]);
  });
});

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm(12.97, 77.59, 12.97, 77.59)).toBe(0);
  });

  it("matches one degree of longitude at the equator", () => {
    expect(haversineKm(0, 0, 0, 1)).toBeCloseTo(111.19, 1);
  });

  it("is symmetric and realistic for city distances", () => {
    // Bengaluru (MG Road) → Pune (Shivajinagar) is roughly 735 km as the crow flies.
    const a = haversineKm(12.9756, 77.605, 18.5308, 73.8475);
    const b = haversineKm(18.5308, 73.8475, 12.9756, 77.605);
    expect(a).toBeCloseTo(b, 6);
    expect(a).toBeGreaterThan(700);
    expect(a).toBeLessThan(770);
  });
});
