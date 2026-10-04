export const APP_NAME = "PGConnect";
export const SUPPORT_EMAIL = "support@pgconnect.site";
export const SUPPORT_PHONE = "+91 90000 00000";

export const AMENITIES = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "ac", label: "Air conditioning" },
  { id: "meals", label: "Meals" },
  { id: "laundry", label: "Laundry" },
  { id: "housekeeping", label: "Housekeeping" },
  { id: "power_backup", label: "Power backup" },
  { id: "attached_bathroom", label: "Attached bathroom" },
  { id: "hot_water", label: "Hot water" },
  { id: "parking", label: "Parking" },
  { id: "cctv", label: "CCTV" },
  { id: "security", label: "24x7 security" },
  { id: "gym", label: "Gym" },
  { id: "tv", label: "TV" },
  { id: "fridge", label: "Fridge" },
  { id: "ro_water", label: "RO drinking water" },
  { id: "study_table", label: "Study table" },
  { id: "wardrobe", label: "Wardrobe" },
  { id: "lift", label: "Lift" },
] as const;

export type AmenityId = (typeof AMENITIES)[number]["id"];
export const AMENITY_IDS = AMENITIES.map((a) => a.id) as [AmenityId, ...AmenityId[]];
export const amenityLabel = (id: string) => AMENITIES.find((a) => a.id === id)?.label ?? id;

export const SHARING_TYPES = [
  { value: 1, label: "Single" },
  { value: 2, label: "Double" },
  { value: 3, label: "Triple" },
  { value: 4, label: "4+ sharing" },
] as const;
export const sharingLabel = (value: number) =>
  SHARING_TYPES.find((s) => s.value === value)?.label ?? `${value} sharing`;

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Boys" },
  { value: "FEMALE", label: "Girls" },
  { value: "ANY", label: "Co-living" },
] as const;
export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];
export const genderLabel = (value: string) =>
  GENDER_OPTIONS.find((g) => g.value === value)?.label ?? value;

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const REPORT_REASONS = [
  { value: "FAKE_LISTING", label: "Fake or misleading listing" },
  { value: "WRONG_INFO", label: "Wrong price / details" },
  { value: "ALREADY_FULL", label: "PG is full / not available" },
  { value: "SCAM", label: "Asked for advance payment / scam" },
  { value: "OFFENSIVE", label: "Offensive content" },
  { value: "OTHER", label: "Something else" },
] as const;

export const POPULAR_CITIES = [
  "bengaluru",
  "pune",
  "hyderabad",
  "delhi",
  "noida",
  "gurugram",
  "mumbai",
  "chennai",
  "chandigarh",
  "kota",
  "indore",
  "ahmedabad",
] as const;

export const LISTING_LIMITS = {
  minImages: 3,
  maxImages: 10,
  maxImageBytes: 5 * 1024 * 1024,
  imageTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export type PlanId = "FREE" | "BASIC" | "PREMIUM";

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    priceMonthly: number;
    listingLimit: number;
    tagline: string;
    features: string[];
    highlighted?: boolean;
  }
> = {
  FREE: {
    id: "FREE",
    name: "Starter",
    priceMonthly: 0,
    listingLimit: 1,
    tagline: "List your first PG at zero cost",
    features: [
      "1 active listing",
      "Unlimited tenant chats",
      "Callback & visit requests",
      "Email alerts for new leads",
    ],
  },
  BASIC: {
    id: "BASIC",
    name: "Growth",
    priceMonthly: 499,
    listingLimit: 5,
    tagline: "For owners with a few properties",
    highlighted: true,
    features: [
      "Up to 5 active listings",
      "Everything in Starter",
      "Listing performance insights",
      "Priority placement over free listings",
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Pro",
    priceMonthly: 4999,
    listingLimit: 25,
    tagline: "For PG chains and property managers",
    features: [
      "Up to 25 active listings",
      "Everything in Growth",
      "Top placement in search results",
      "Featured badge on every listing",
    ],
  },
};

export const PLAN_RANK: Record<PlanId, number> = { FREE: 0, BASIC: 1, PREMIUM: 2 };
