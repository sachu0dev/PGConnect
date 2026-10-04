import { describe, expect, it } from "vitest";
import { cityFromSlug, citySlug, formatINR, initials, maskPhone, pluralize, titleCase, truncate } from "./format";

describe("formatINR", () => {
  it("uses Indian digit grouping without decimals", () => {
    expect(formatINR(8500)).toBe("₹8,500");
    expect(formatINR(150000)).toBe("₹1,50,000");
    expect(formatINR(7499.6)).toBe("₹7,500");
  });

  it("renders a dash for missing values", () => {
    expect(formatINR(null)).toBe("—");
    expect(formatINR(undefined)).toBe("—");
    expect(formatINR(Number.NaN)).toBe("—");
  });
});

describe("text helpers", () => {
  it("title-cases city names", () => {
    expect(titleCase("navi mumbai")).toBe("Navi Mumbai");
    expect(titleCase("  HSR   layout ")).toBe("Hsr Layout");
  });

  it("round-trips city slugs", () => {
    expect(citySlug("Navi Mumbai")).toBe("navi-mumbai");
    expect(citySlug(" Bengaluru! ")).toBe("bengaluru");
    expect(cityFromSlug("navi-mumbai")).toBe("navi mumbai");
    expect(cityFromSlug("New%20Delhi")).toBe("new delhi");
  });

  it("builds initials", () => {
    expect(initials("rahul_sharma")).toBe("RS");
    expect(initials("priya")).toBe("P");
    expect(initials("a.b.c")).toBe("AB");
  });

  it("masks phone numbers", () => {
    expect(maskPhone("9876543210")).toBe("98••••••10");
    expect(maskPhone("12")).toBe("••••••");
  });

  it("pluralizes and truncates", () => {
    expect(pluralize(1, "bed")).toBe("1 bed");
    expect(pluralize(3, "bed")).toBe("3 beds");
    expect(pluralize(2, "PG", "PGs")).toBe("2 PGs");
    expect(truncate("Koramangala", 20)).toBe("Koramangala");
    expect(truncate("Koramangala 6th Block", 12)).toBe("Koramangala…");
  });
});
