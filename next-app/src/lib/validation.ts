import { z } from "zod";
import { AMENITY_IDS, REPORT_REASONS } from "./constants";

/** Normalises Indian mobile numbers to their 10-digit form. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

export const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(72),
});

export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: otpSchema,
});

export const emailOnlySchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: otpSchema,
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: passwordSchema,
});

export const profileSchema = z.object({
  username: usernameSchema.optional(),
  phoneNumber: phoneSchema.optional().or(z.literal("").transform(() => null)),
});

const coerceNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), schema);

const coerceOptionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    schema.nullable()
  );

const coerceBoolean = z.preprocess(
  (v) => (typeof v === "string" ? v === "true" || v === "on" : v),
  z.boolean()
);

const coerceArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      if (v.trim() === "") return [];
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return v.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return v;
  }, z.array(item));

/** Full listing schema. Used for creation and (partially) for updates. */
export const listingBaseSchema = z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(80),
    contact: phoneSchema,
    city: z.string().trim().min(2, "City is required").max(60).transform((c) => c.toLowerCase()),
    locality: z
      .string()
      .trim()
      .max(80)
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    address: z.string().trim().min(5, "Full address is required").max(300),
    latitude: coerceOptionalNumber(z.number().min(-90).max(90)),
    longitude: coerceOptionalNumber(z.number().min(-180).max(180)),
    rentPerMonth: coerceNumber(
      z.number({ invalid_type_error: "Rent is required" }).int().min(500, "Rent looks too low").max(500000)
    ),
    deposit: coerceNumber(z.number().int().min(0).max(1000000)).default(0),
    capacity: coerceNumber(z.number().int().min(1, "Add at least 1 bed").max(2000)),
    capacityCount: coerceNumber(z.number().int().min(0).max(2000)).default(0),
    gender: z.enum(["MALE", "FEMALE", "ANY"]),
    sharingTypes: coerceArray(z.coerce.number().int().min(1).max(4))
      .refine((v) => v.length > 0, "Select at least one sharing type")
      .transform((v) => Array.from(new Set(v)).sort()),
    amenities: coerceArray(z.enum(AMENITY_IDS)).default([]).transform((v) => Array.from(new Set(v))),
    foodIncluded: coerceBoolean.default(false),
    houseRules: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    noticePeriodDays: coerceOptionalNumber(z.number().int().min(0).max(180)),
    description: z
      .string()
      .trim()
      .min(30, "Describe your PG in at least 30 characters")
      .max(3000, "Description must be at most 3000 characters"),
});

export const listingSchema = listingBaseSchema.refine((v) => v.capacityCount <= v.capacity, {
  message: "Occupied beds cannot exceed total beds",
  path: ["capacityCount"],
});

export type ListingInput = z.infer<typeof listingSchema>;

export const listingUpdateSchema = listingBaseSchema
  .partial()
  .extend({ status: z.enum(["ACTIVE", "PAUSED"]).optional() })
  .refine(
    (v) =>
      v.capacity === undefined || v.capacityCount === undefined || v.capacityCount <= v.capacity,
    { message: "Occupied beds cannot exceed total beds", path: ["capacityCount"] }
  );

export const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  gender: z.enum(["MALE", "FEMALE", "ANY"]).optional(),
  sharing: z.coerce.number().int().min(1).max(4).optional(),
  minRent: z.coerce.number().int().min(0).optional(),
  maxRent: z.coerce.number().int().min(0).optional(),
  amenities: z
    .string()
    .optional()
    .transform((v) =>
      v ? v.split(",").filter((a): a is (typeof AMENITY_IDS)[number] => (AMENITY_IDS as string[]).includes(a)) : []
    ),
  food: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  available: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  verified: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(50).default(5),
  sort: z.enum(["recommended", "newest", "price_asc", "price_desc", "rating", "distance"]).default("recommended"),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export type SearchParams = z.infer<typeof searchSchema>;

export const leadSchema = z
  .object({
    type: z.enum(["CALLBACK", "VISIT"]).default("CALLBACK"),
    name: z.string().trim().min(2, "Enter your name").max(60),
    phoneNumber: phoneSchema,
    message: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v ? v : null)),
    visitDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .optional()
      .transform((v) => (v ? new Date(v) : null)),
  })
  .refine((v) => v.type !== "VISIT" || v.visitDate, {
    message: "Pick a date for your visit",
    path: ["visitDate"],
  })
  .refine(
    (v) => !v.visitDate || v.visitDate.getTime() >= new Date().setHours(0, 0, 0, 0),
    { message: "Visit date cannot be in the past", path: ["visitDate"] }
  );

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : null)),
});

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS.map((r) => r.value) as [string, ...string[]]),
  details: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : null)),
});

export const messageSchema = z.object({
  text: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});

export const startChatSchema = z.object({
  message: z.string().trim().min(1).max(2000).optional(),
});

export const ownerVerificationSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name as on the document").max(80),
  documentType: z.enum(["AADHAAR", "PAN", "DRIVING_LICENCE", "VOTER_ID", "PASSPORT", "PROPERTY_PAPER"]),
  documentLast4: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4}$/, "Enter only the last 4 characters of the document number"),
});

export const leadStatusSchema = z.object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) });
