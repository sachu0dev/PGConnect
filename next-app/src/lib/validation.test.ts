import { describe, expect, it } from "vitest";
import {
  leadSchema,
  listingSchema,
  normalizePhone,
  phoneSchema,
  searchSchema,
} from "./validation";

describe("normalizePhone / phoneSchema", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["+91 98765 43210", "9876543210"],
    ["91-98765-43210", "9876543210"],
    ["09876543210", "9876543210"],
    ["(987) 654-3210", "9876543210"],
  ])("normalises %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
    expect(phoneSchema.parse(input)).toBe(expected);
  });

  it.each(["12345", "5876543210", "98765432101", "", "abcdefghij"])("rejects %s", (input) => {
    expect(phoneSchema.safeParse(input).success).toBe(false);
  });
});

const multipartListing = {
  name: "Sunrise Boys PG",
  contact: "+91 98765 43210",
  city: " Bengaluru ",
  locality: "Koramangala",
  address: "12, 5th Cross, 6th Block, Koramangala",
  latitude: "12.9352",
  longitude: "77.6245",
  rentPerMonth: "8500",
  capacity: "20",
  capacityCount: "12",
  gender: "MALE",
  sharingTypes: "2,1,2",
  amenities: "wifi,ac,wifi",
  foodIncluded: "on",
  houseRules: "",
  noticePeriodDays: "",
  description: "Clean and safe PG near Forum Mall with home-style food and fast Wi-Fi.",
};

describe("listingSchema (multipart coercion)", () => {
  it("coerces form strings into typed values", () => {
    const parsed = listingSchema.parse(multipartListing);
    expect(parsed).toMatchObject({
      contact: "9876543210",
      city: "bengaluru",
      latitude: 12.9352,
      longitude: 77.6245,
      rentPerMonth: 8500,
      deposit: 0,
      capacity: 20,
      capacityCount: 12,
      sharingTypes: [1, 2],
      amenities: ["wifi", "ac"],
      foodIncluded: true,
      houseRules: null,
      noticePeriodDays: null,
    });
  });

  it("accepts JSON-encoded arrays and boolean strings", () => {
    const parsed = listingSchema.parse({
      ...multipartListing,
      sharingTypes: '["3","1"]',
      amenities: '["laundry"]',
      foodIncluded: "false",
    });
    expect(parsed.sharingTypes).toEqual([1, 3]);
    expect(parsed.amenities).toEqual(["laundry"]);
    expect(parsed.foodIncluded).toBe(false);
  });

  it("parses an explicit deposit", () => {
    expect(listingSchema.parse({ ...multipartListing, deposit: "17000" }).deposit).toBe(17000);
  });

  it("requires at least one sharing type", () => {
    const result = listingSchema.safeParse({ ...multipartListing, sharingTypes: "" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown amenities", () => {
    expect(listingSchema.safeParse({ ...multipartListing, amenities: "wifi,jacuzzi" }).success).toBe(false);
  });

  it("rejects more occupied beds than total beds", () => {
    const result = listingSchema.safeParse({ ...multipartListing, capacity: "5", capacityCount: "6" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["capacityCount"]);
  });

  it("rejects unrealistic rent and missing rent", () => {
    expect(listingSchema.safeParse({ ...multipartListing, rentPerMonth: "100" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...multipartListing, rentPerMonth: "" }).success).toBe(false);
  });
});

describe("searchSchema", () => {
  it("applies defaults", () => {
    expect(searchSchema.parse({})).toEqual({
      radiusKm: 5,
      sort: "recommended",
      page: 1,
      limit: 12,
      amenities: [],
      available: false,
      verified: false,
      food: undefined,
    });
  });

  it("parses amenities and drops unknown ids", () => {
    expect(searchSchema.parse({ amenities: "wifi,bogus,ac" }).amenities).toEqual(["wifi", "ac"]);
  });

  it("coerces numbers and booleans from query strings", () => {
    const parsed = searchSchema.parse({
      minRent: "5000",
      maxRent: "12000",
      sharing: "2",
      food: "false",
      available: "true",
      page: "3",
    });
    expect(parsed).toMatchObject({ minRent: 5000, maxRent: 12000, sharing: 2, food: false, available: true, page: 3 });
  });

  it("caps page size and rejects unknown sort values", () => {
    expect(searchSchema.safeParse({ limit: "500" }).success).toBe(false);
    expect(searchSchema.safeParse({ sort: "cheapest" }).success).toBe(false);
  });
});

describe("leadSchema", () => {
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  it("defaults to a callback and normalises optional fields", () => {
    const parsed = leadSchema.parse({ name: "Aditi", phoneNumber: "+919876543210", message: "" });
    expect(parsed).toMatchObject({ type: "CALLBACK", phoneNumber: "9876543210", message: null, visitDate: null });
  });

  it("requires a date for visits", () => {
    const result = leadSchema.safeParse({ type: "VISIT", name: "Aditi", phoneNumber: "9876543210" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["visitDate"]);
  });

  it("accepts a future visit date", () => {
    const parsed = leadSchema.parse({ type: "VISIT", name: "Aditi", phoneNumber: "9876543210", visitDate: tomorrow() });
    expect(parsed.visitDate).toBeInstanceOf(Date);
  });

  it("rejects a visit date in the past", () => {
    const result = leadSchema.safeParse({
      type: "VISIT",
      name: "Aditi",
      phoneNumber: "9876543210",
      visitDate: "2020-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed dates", () => {
    const result = leadSchema.safeParse({ type: "VISIT", name: "Aditi", phoneNumber: "9876543210", visitDate: "next monday" });
    expect(result.success).toBe(false);
  });
});
