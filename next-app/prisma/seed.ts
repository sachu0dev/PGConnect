/**
 * Development seed: demo accounts, cities and ~16 realistic PG listings.
 *
 *   yarn db:seed
 *
 * Idempotent — demo users are upserted by email and their listings (plus
 * everything hanging off them) are recreated on every run. Refuses to run with
 * NODE_ENV=production unless SEED_FORCE=true.
 *
 * Demo logins (password "Password123"):
 *   owner@pgconnect.dev   – verified owner on the Pro plan, also an admin (dev only)
 *   owner2@pgconnect.dev  – owner on the Growth plan with a PENDING verification
 *   owner3@pgconnect.dev  – owner on the free plan
 *   tenant@pgconnect.dev  – tenant with a shortlist, enquiries and a chat
 */
import { promises as fs } from "fs";
import path from "path";
import zlib from "zlib";
import bcrypt from "bcryptjs";
import { Gender, Membership, PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "true") {
  console.error("Refusing to seed a production database. Set SEED_FORCE=true if you really mean it.");
  process.exit(1);
}

const prisma = new PrismaClient();
const PASSWORD = "Password123";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=70`;
const PHOTOS = [
  "1505693416388-ac5ce068fe85",
  "1522708323590-d24dbb6b0267",
  "1502672260266-1c1ef2d93688",
  "1560448204-e02f11c3d0e2",
  "1555854877-bab0e564b8d5",
  "1586023492125-27b2c045efd7",
  "1540518614846-7eded433c457",
  "1493809842364-78817add7ffb",
].map(img);

/** Deterministic rotation so each listing gets a different 3–5 photo set. */
function photosFor(index: number) {
  const count = 3 + (index % 3);
  return Array.from({ length: count }, (_, i) => PHOTOS[(index * 3 + i) % PHOTOS.length]!);
}

type OwnerKey = "owner" | "owner2" | "owner3";

type SeedListing = {
  owner: OwnerKey;
  name: string;
  city: string;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  rentPerMonth: number;
  deposit: number;
  gender: Gender;
  sharingTypes: number[];
  amenities: string[];
  foodIncluded: boolean;
  capacity: number;
  capacityCount: number;
  noticePeriodDays: number;
  houseRules: string;
  description: string;
  contact: string;
};

const LISTINGS: SeedListing[] = [
  {
    owner: "owner",
    name: "Nest Koramangala Boys PG",
    city: "bengaluru",
    locality: "Koramangala 5th Block",
    address: "14, 17th Main Road, Koramangala 5th Block, Bengaluru 560095",
    latitude: 12.9345,
    longitude: 77.619,
    rentPerMonth: 11500,
    deposit: 23000,
    gender: "MALE",
    sharingTypes: [1, 2, 3],
    amenities: ["wifi", "meals", "laundry", "housekeeping", "power_backup", "hot_water", "cctv", "ro_water"],
    foodIncluded: true,
    capacity: 36,
    capacityCount: 30,
    noticePeriodDays: 30,
    houseRules: "Gate closes at 11:30 pm. No smoking or alcohol inside the premises. Visitors allowed in the common area till 8 pm.",
    description:
      "Walk to Forum Mall, Sony World signal and the startup offices on 80 Feet Road. Spacious rooms with study tables, wardrobes and attached bathrooms on every floor. North and South Indian breakfast and dinner on weekdays, all three meals on weekends. Daily housekeeping and twice-a-week laundry included.",
    contact: "9999900101",
  },
  {
    owner: "owner",
    name: "Lavender Ladies Residency",
    city: "bengaluru",
    locality: "Koramangala 6th Block",
    address: "52, 1st Cross, Koramangala 6th Block, Bengaluru 560095",
    latitude: 12.938,
    longitude: 77.626,
    rentPerMonth: 13500,
    deposit: 27000,
    gender: "FEMALE",
    sharingTypes: [1, 2],
    amenities: ["wifi", "ac", "meals", "laundry", "housekeeping", "attached_bathroom", "security", "cctv", "fridge"],
    foodIncluded: true,
    capacity: 24,
    capacityCount: 21,
    noticePeriodDays: 30,
    houseRules: "Women only. Biometric entry, in-time 10:30 pm (late entry with prior intimation). Guests not allowed in rooms.",
    description:
      "A calm, well-lit PG for working women and students, five minutes from Jyoti Nivas College. Air-conditioned rooms, 24x7 lady warden, biometric access and CCTV in all common areas. Home-style vegetarian meals with a non-veg option twice a week.",
    contact: "9999900102",
  },
  {
    owner: "owner",
    name: "Zenith Co-living HSR",
    city: "bengaluru",
    locality: "HSR Layout Sector 2",
    address: "221, 27th Main, HSR Layout Sector 2, Bengaluru 560102",
    latitude: 12.9116,
    longitude: 77.6473,
    rentPerMonth: 16000,
    deposit: 32000,
    gender: "ANY",
    sharingTypes: [1, 2],
    amenities: ["wifi", "ac", "housekeeping", "power_backup", "attached_bathroom", "gym", "tv", "fridge", "lift", "parking"],
    foodIncluded: false,
    capacity: 40,
    capacityCount: 33,
    noticePeriodDays: 30,
    houseRules: "Separate floors for men and women. Quiet hours after 11 pm. No pets.",
    description:
      "Modern co-living with a rooftop lounge, a small gym and a fully equipped shared kitchen. Close to the HSR BDA Complex, Agara Lake and the Outer Ring Road tech parks. Fibre Wi-Fi with 100 Mbps, weekly deep cleaning and a community manager on site.",
    contact: "9999900103",
  },
  {
    owner: "owner2",
    name: "Sai Krupa PG for Gents",
    city: "bengaluru",
    locality: "HSR Layout Sector 7",
    address: "88, 9th Cross, HSR Layout Sector 7, Bengaluru 560102",
    latitude: 12.9081,
    longitude: 77.6389,
    rentPerMonth: 7500,
    deposit: 10000,
    gender: "MALE",
    sharingTypes: [2, 3, 4],
    amenities: ["wifi", "meals", "hot_water", "power_backup", "ro_water", "wardrobe"],
    foodIncluded: true,
    capacity: 48,
    capacityCount: 41,
    noticePeriodDays: 15,
    houseRules: "Gate closes at 11 pm. Alcohol not permitted.",
    description:
      "Budget-friendly PG for students and freshers working in HSR and Bommanahalli. Three meals a day included, unlimited RO water and hot water in the mornings. Bus stop and metro feeder at the corner of the street.",
    contact: "9999900104",
  },
  {
    owner: "owner",
    name: "Brookfield Comfort Stay",
    city: "bengaluru",
    locality: "Whitefield",
    address: "17, EPIP Zone Road, near ITPL Main Road, Whitefield, Bengaluru 560066",
    latitude: 12.985,
    longitude: 77.731,
    rentPerMonth: 12500,
    deposit: 25000,
    gender: "ANY",
    sharingTypes: [1, 2, 3],
    amenities: ["wifi", "ac", "meals", "laundry", "housekeeping", "power_backup", "attached_bathroom", "parking", "lift"],
    foodIncluded: true,
    capacity: 60,
    capacityCount: 52,
    noticePeriodDays: 30,
    houseRules: "Separate wings for men and women. Visitors allowed in the lobby till 9 pm.",
    description:
      "Walking distance from ITPL, Prestige Shantiniketan and the Whitefield metro station. Fully furnished rooms with AC, attached bathrooms and power backup. Breakfast and dinner served buffet-style; tea and snacks in the evening.",
    contact: "9999900105",
  },
  {
    owner: "owner2",
    name: "Green Leaf Ladies PG Whitefield",
    city: "bengaluru",
    locality: "Hope Farm, Whitefield",
    address: "4, Channasandra Main Road, near Hope Farm Junction, Whitefield, Bengaluru 560066",
    latitude: 12.9833,
    longitude: 77.7539,
    rentPerMonth: 9000,
    deposit: 15000,
    gender: "FEMALE",
    sharingTypes: [2, 3],
    amenities: ["wifi", "meals", "laundry", "hot_water", "security", "cctv", "study_table"],
    foodIncluded: true,
    capacity: 30,
    capacityCount: 22,
    noticePeriodDays: 30,
    houseRules: "Women only. In-time 10 pm. Parents may visit on weekends.",
    description:
      "Safe and homely PG for women near Hope Farm with quick access to Whitefield metro and the tech parks along Varthur Road. Vegetarian meals cooked fresh daily, washing machine on every floor and a resident warden.",
    contact: "9999900106",
  },
  {
    owner: "owner",
    name: "Skyline Hinjewadi Residency",
    city: "pune",
    locality: "Hinjewadi Phase 1",
    address: "Survey No. 23, Shivaji Chowk, Hinjewadi Phase 1, Pune 411057",
    latitude: 18.5913,
    longitude: 73.7389,
    rentPerMonth: 9500,
    deposit: 19000,
    gender: "MALE",
    sharingTypes: [1, 2, 3],
    amenities: ["wifi", "meals", "laundry", "housekeeping", "power_backup", "hot_water", "parking", "tv"],
    foodIncluded: true,
    capacity: 45,
    capacityCount: 38,
    noticePeriodDays: 30,
    houseRules: "No smoking inside rooms. Gate closes at midnight.",
    description:
      "Ten minutes from Infosys, Wipro and the Rajiv Gandhi Infotech Park Phase 1. Two-wheeler parking, power backup and high-speed Wi-Fi for work-from-home days. Maharashtrian and North Indian thali for breakfast and dinner.",
    contact: "9999900107",
  },
  {
    owner: "owner3",
    name: "Om Sai Girls Hostel Hinjewadi",
    city: "pune",
    locality: "Hinjewadi Phase 2",
    address: "Plot 9, Maan Road, Hinjewadi Phase 2, Pune 411057",
    latitude: 18.5868,
    longitude: 73.7015,
    rentPerMonth: 8000,
    deposit: 8000,
    gender: "FEMALE",
    sharingTypes: [2, 3],
    amenities: ["wifi", "meals", "hot_water", "security", "cctv", "ro_water", "wardrobe"],
    foodIncluded: true,
    capacity: 28,
    capacityCount: 19,
    noticePeriodDays: 15,
    houseRules: "Women only. In-time 10:30 pm. No male visitors beyond reception.",
    description:
      "Affordable girls hostel close to the Phase 2 IT companies and the Maan Road bus stop. Clean shared rooms, vegetarian home food and a 24x7 security guard at the gate.",
    contact: "9999900108",
  },
  {
    owner: "owner",
    name: "Airport Road Co-living Viman Nagar",
    city: "pune",
    locality: "Viman Nagar",
    address: "Lane 6, Datta Mandir Chowk, Viman Nagar, Pune 411014",
    latitude: 18.5679,
    longitude: 73.9143,
    rentPerMonth: 14500,
    deposit: 29000,
    gender: "ANY",
    sharingTypes: [1, 2],
    amenities: ["wifi", "ac", "housekeeping", "laundry", "attached_bathroom", "gym", "fridge", "tv", "lift"],
    foodIncluded: false,
    capacity: 32,
    capacityCount: 30,
    noticePeriodDays: 30,
    houseRules: "Separate floors for men and women. Quiet hours after 11 pm.",
    description:
      "Premium co-living a short walk from Phoenix Marketcity, Symbiosis and the EON IT Park shuttle. Air-conditioned rooms, a fully stocked pantry, weekly housekeeping and a small gym.",
    contact: "9999900109",
  },
  {
    owner: "owner",
    name: "Campus Corner PG Kamla Nagar",
    city: "delhi",
    locality: "North Campus",
    address: "Block 12, Kamla Nagar, near Hansraj College, Delhi 110007",
    latitude: 28.6814,
    longitude: 77.2054,
    rentPerMonth: 14000,
    deposit: 14000,
    gender: "MALE",
    sharingTypes: [1, 2, 3],
    amenities: ["wifi", "ac", "meals", "laundry", "housekeeping", "power_backup", "study_table", "ro_water"],
    foodIncluded: true,
    capacity: 40,
    capacityCount: 37,
    noticePeriodDays: 30,
    houseRules: "Students only. Entry till 10:30 pm. Quiet hours during exams.",
    description:
      "Made for DU students — five minutes from Hansraj, Kirori Mal and Hindu College and close to the Vishwavidyalaya metro station. AC rooms with study tables, a silent reading room and three meals a day.",
    contact: "9999900110",
  },
  {
    owner: "owner2",
    name: "Shree Ladies PG GTB Nagar",
    city: "delhi",
    locality: "North Campus",
    address: "House 41, Hudson Lane, GTB Nagar, Delhi 110009",
    latitude: 28.6976,
    longitude: 77.2063,
    rentPerMonth: 12000,
    deposit: 12000,
    gender: "FEMALE",
    sharingTypes: [2, 3],
    amenities: ["wifi", "ac", "meals", "laundry", "security", "cctv", "study_table", "hot_water"],
    foodIncluded: true,
    capacity: 26,
    capacityCount: 20,
    noticePeriodDays: 30,
    houseRules: "Women only. In-time 9:30 pm. Local guardian details required at check-in.",
    description:
      "Popular with Miranda House and SRCC students. Next to GTB Nagar metro and the cafés of Hudson Lane. Resident warden, CCTV, biometric entry and nutritious vegetarian meals.",
    contact: "9999900111",
  },
  {
    owner: "owner",
    name: "Metro View PG Laxmi Nagar",
    city: "delhi",
    locality: "Laxmi Nagar",
    address: "D-24, Vikas Marg, Laxmi Nagar, Delhi 110092",
    latitude: 28.6304,
    longitude: 77.2777,
    rentPerMonth: 7000,
    deposit: 7000,
    gender: "MALE",
    sharingTypes: [2, 3, 4],
    amenities: ["wifi", "meals", "power_backup", "ro_water", "hot_water"],
    foodIncluded: true,
    capacity: 50,
    capacityCount: 44,
    noticePeriodDays: 15,
    houseRules: "Gate closes at 11 pm. Alcohol not permitted.",
    description:
      "Affordable PG for CA, SSC and banking aspirants near the Laxmi Nagar coaching hub. Two minutes from Laxmi Nagar metro. Two meals a day, inverter backup and a quiet study area.",
    contact: "9999900112",
  },
  {
    owner: "owner",
    name: "The Rose Garden PG Sector 15",
    city: "chandigarh",
    locality: "Sector 15",
    address: "House 1128, Sector 15-B, Chandigarh 160015",
    latitude: 30.7525,
    longitude: 76.77,
    rentPerMonth: 9500,
    deposit: 9500,
    gender: "FEMALE",
    sharingTypes: [1, 2],
    amenities: ["wifi", "meals", "laundry", "housekeeping", "hot_water", "security", "study_table"],
    foodIncluded: true,
    capacity: 18,
    capacityCount: 15,
    noticePeriodDays: 30,
    houseRules: "Women only. In-time 9:30 pm. Guests in the visitors' room only.",
    description:
      "Peaceful house PG a short walk from Panjab University's south gate and the Sector 15 market. Ideal for PU and PGIMER students. Home-cooked Punjabi meals, a geyser in every bathroom and a family-run, caring atmosphere.",
    contact: "9999900113",
  },
  {
    owner: "owner2",
    name: "Scholars' Den Boys PG",
    city: "chandigarh",
    locality: "Sector 15",
    address: "House 2247, Sector 15-C, Chandigarh 160015",
    latitude: 30.7491,
    longitude: 76.7735,
    rentPerMonth: 8500,
    deposit: 8500,
    gender: "MALE",
    sharingTypes: [2, 3],
    amenities: ["wifi", "meals", "laundry", "power_backup", "hot_water", "study_table", "wardrobe"],
    foodIncluded: true,
    capacity: 22,
    capacityCount: 22,
    noticePeriodDays: 30,
    houseRules: "Students only. Gate closes at 10:30 pm.",
    description:
      "Boys PG for Panjab University and coaching students, close to the Sector 15 market and PU campus. Clean twin and triple rooms, home food and a library corner. Currently full — enquire for the next vacancy.",
    contact: "9999900114",
  },
  {
    owner: "owner",
    name: "Cyber Towers Co-living Gachibowli",
    city: "hyderabad",
    locality: "Gachibowli",
    address: "Plot 31, Telecom Nagar, Gachibowli, Hyderabad 500032",
    latitude: 17.4401,
    longitude: 78.3489,
    rentPerMonth: 13000,
    deposit: 26000,
    gender: "ANY",
    sharingTypes: [1, 2, 3],
    amenities: ["wifi", "ac", "meals", "laundry", "housekeeping", "power_backup", "attached_bathroom", "gym", "lift", "parking"],
    foodIncluded: true,
    capacity: 70,
    capacityCount: 58,
    noticePeriodDays: 30,
    houseRules: "Separate floors for men and women. No loud music after 10 pm.",
    description:
      "Close to the Financial District, DLF Cyber City and ISB. Shuttle to Raidurg metro every morning. AC rooms with attached bathrooms, a gym and a terrace café. Hyderabadi and South Indian meals included.",
    contact: "9999900115",
  },
  {
    owner: "owner2",
    name: "Sri Venkateswara Gents PG",
    city: "hyderabad",
    locality: "Gachibowli",
    address: "H.No 2-48, Indira Nagar, Gachibowli, Hyderabad 500032",
    latitude: 17.4435,
    longitude: 78.356,
    rentPerMonth: 7800,
    deposit: 7800,
    gender: "MALE",
    sharingTypes: [2, 3, 4],
    amenities: ["wifi", "meals", "hot_water", "power_backup", "ro_water"],
    foodIncluded: true,
    capacity: 54,
    capacityCount: 39,
    noticePeriodDays: 15,
    houseRules: "Gate closes at 11:30 pm. Smoking only in the designated area.",
    description:
      "Value PG for freshers and interns in the Gachibowli–Kondapur IT corridor. Walk to the Indira Nagar bus stop and the DLF road. Three meals a day, filtered drinking water and inverter backup.",
    contact: "9999900116",
  },
];

const REVIEW_TEXT: { rating: number; comment: string }[] = [
  { rating: 5, comment: "Food is genuinely good and the rooms are cleaned every day. Owner responds quickly on chat." },
  { rating: 4, comment: "Great location and fast Wi-Fi. Hot water can be slow in the mornings but overall worth it." },
  { rating: 4, comment: "Safe and well-maintained. Photos match what you see in person, which I appreciated." },
  { rating: 3, comment: "Decent for the price. Rooms are a bit small but the staff are friendly." },
  { rating: 5, comment: "Stayed here for a year during my internship. Felt like home, would recommend." },
];

/* -------------------------------------------------------------------------- */
/* Tiny PNG writer for a placeholder ID document (local storage only).         */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** A 480x300 card-like image: teal header band on a light background. */
function placeholderIdPng() {
  const width = 480;
  const height = 300;
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      const header = y < 60;
      const photo = x > 30 && x < 140 && y > 90 && y < 230;
      const line = x > 170 && x < 440 && [110, 140, 170, 200].some((ly) => y >= ly && y < ly + 10);
      const [r, g, b] = header ? [27, 136, 118] : photo ? [177, 236, 221] : line ? [203, 213, 225] : [245, 247, 250];
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const s3Configured = Boolean(
  process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME
);

async function writeLocalDocument(userId: string): Promise<string | null> {
  if (process.env.STORAGE_DRIVER === "s3" && s3Configured) return null; // Never push fake documents to a real bucket.
  const key = `private/verification/${userId}/seed-demo-id.png`;
  const target = path.join(process.cwd(), process.env.STORAGE_LOCAL_DIR || "storage", key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, placeholderIdPng());
  return key;
}

/* -------------------------------------------------------------------------- */

async function upsertUser(data: {
  email: string;
  username: string;
  phoneNumber: string;
  isOwner: boolean;
  isAdmin?: boolean;
  membership?: Membership;
  passwordHash: string;
}) {
  const fields = {
    username: data.username,
    password: data.passwordHash,
    phoneNumber: data.phoneNumber,
    isVerified: true,
    isOwner: data.isOwner,
    isAdmin: data.isAdmin ?? false,
    isBanned: false,
    membership: data.membership ?? "FREE",
    verifyCode: null,
    verifyCodeExpireAt: null,
    verifyAttempts: 0,
  };
  return prisma.user.upsert({
    where: { email: data.email },
    update: fields,
    create: { email: data.email, ...fields },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const owner = await upsertUser({
    email: "owner@pgconnect.dev",
    username: "demo_owner",
    phoneNumber: "9999900001",
    isOwner: true,
    isAdmin: true,
    membership: "PREMIUM",
    passwordHash,
  });
  const owner2 = await upsertUser({
    email: "owner2@pgconnect.dev",
    username: "demo_owner_two",
    phoneNumber: "9999900002",
    isOwner: true,
    membership: "BASIC",
    passwordHash,
  });
  const owner3 = await upsertUser({
    email: "owner3@pgconnect.dev",
    username: "demo_owner_three",
    phoneNumber: "9999900003",
    isOwner: true,
    passwordHash,
  });
  const tenant = await upsertUser({
    email: "tenant@pgconnect.dev",
    username: "demo_tenant",
    phoneNumber: "9999900004",
    isOwner: false,
    passwordHash,
  });
  const reviewers = await Promise.all(
    ["ananya", "rohit", "meera"].map((name, i) =>
      upsertUser({
        email: `${name}@pgconnect.dev`,
        username: `demo_${name}`,
        phoneNumber: `999990001${i}`,
        isOwner: false,
        passwordHash,
      })
    )
  );
  const owners: Record<OwnerKey, { id: string }> = { owner, owner2, owner3 };

  // Recreate demo listings (cascades to leads, chats, favourites, reviews, reports).
  await prisma.pg.deleteMany({ where: { ownerId: { in: [owner.id, owner2.id, owner3.id] } } });
  await prisma.chatRoom.deleteMany({ where: { userId: { in: [tenant.id, ...reviewers.map((r) => r.id)] } } });

  const cities = Array.from(new Set(LISTINGS.map((l) => l.city)));
  for (const name of cities) {
    await prisma.city.upsert({ where: { name }, update: {}, create: { name } });
  }

  const now = Date.now();
  const pgs = [];
  for (const [index, listing] of LISTINGS.entries()) {
    const { owner: ownerKey, ...data } = listing;
    pgs.push(
      await prisma.pg.create({
        data: {
          ...data,
          images: photosFor(index),
          ownerId: owners[ownerKey].id,
          views: 40 + ((index * 37) % 260),
          // Spread creation dates over the last ~6 weeks so "newest" sorting is meaningful.
          createdAt: new Date(now - index * 2.5 * 24 * 60 * 60 * 1000),
        },
      })
    );
  }

  // Reviews on a handful of listings.
  const reviewerIds = [tenant.id, ...reviewers.map((r) => r.id)];
  for (const [pgIndex, pg] of pgs.entries()) {
    if (pgIndex % 3 === 2) continue;
    const count = 1 + (pgIndex % 4);
    const ratings: number[] = [];
    for (let i = 0; i < count; i++) {
      const review = REVIEW_TEXT[(pgIndex + i) % REVIEW_TEXT.length]!;
      ratings.push(review.rating);
      await prisma.review.create({
        data: {
          pgId: pg.id,
          userId: reviewerIds[i % reviewerIds.length]!,
          rating: review.rating,
          comment: review.comment,
          createdAt: new Date(now - (i + 1) * 5 * 24 * 60 * 60 * 1000),
        },
      });
    }
    await prisma.pg.update({
      where: { id: pg.id },
      data: { avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length, reviewCount: ratings.length },
    });
  }

  // Tenant activity: shortlist, a callback + visit request and a chat.
  const [first, second, third] = pgs;
  await prisma.favorite.createMany({
    data: [first!, second!, pgs[6]!].map((pg) => ({ userId: tenant.id, pgId: pg.id })),
    skipDuplicates: true,
  });
  const visitDate = new Date(now + 3 * 24 * 60 * 60 * 1000);
  visitDate.setHours(0, 0, 0, 0);
  await prisma.lead.createMany({
    data: [
      {
        pgId: first!.id,
        userId: tenant.id,
        type: "CALLBACK",
        name: "Demo Tenant",
        phoneNumber: tenant.phoneNumber!,
        message: "Is a single room available from the 1st of next month?",
      },
      {
        pgId: third!.id,
        userId: tenant.id,
        type: "VISIT",
        name: "Demo Tenant",
        phoneNumber: tenant.phoneNumber!,
        message: "I can come after 6 pm.",
        visitDate,
      },
    ],
  });
  const chat = await prisma.chatRoom.create({ data: { pgId: first!.id, userId: tenant.id } });
  const messages = [
    { senderId: tenant.id, text: "Hi! Is a single-sharing room available from next month?" },
    { senderId: owner.id, text: "Yes, we have one single room on the second floor. Rent is ₹11,500 with food." },
    { senderId: tenant.id, text: "Great, can I visit this Saturday around 11 am?" },
  ];
  for (const [i, m] of messages.entries()) {
    await prisma.message.create({
      data: {
        chatRoomId: chat.id,
        senderId: m.senderId,
        text: m.text,
        status: i < messages.length - 1 ? "READ" : "SENT",
        createdAt: new Date(now - (messages.length - i) * 20 * 60 * 1000),
      },
    });
  }
  await prisma.chatRoom.update({ where: { id: chat.id }, data: { lastMessageAt: new Date(now - 20 * 60 * 1000) } });

  // An open report so the admin queue has something to show.
  await prisma.report.create({
    data: {
      pgId: pgs[11]!.id,
      userId: reviewers[0]!.id,
      reason: "WRONG_INFO",
      details: "Rent on the listing is ₹7,000 but the owner quoted ₹8,500 on the phone.",
    },
  });

  // Owner verifications: one approved, one pending (with a local placeholder document).
  await prisma.ownerVerification.upsert({
    where: { userId: owner.id },
    update: { status: "APPROVED", reviewNote: null, reviewedAt: new Date(), documentKey: null },
    create: {
      userId: owner.id,
      fullName: "Demo Owner",
      documentType: "AADHAAR",
      documentLast4: "4821",
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });
  const documentKey = await writeLocalDocument(owner2.id);
  await prisma.ownerVerification.upsert({
    where: { userId: owner2.id },
    update: { status: "PENDING", reviewNote: null, reviewedAt: null, documentKey, createdAt: new Date() },
    create: {
      userId: owner2.id,
      fullName: "Demo Owner Two",
      documentType: "PAN",
      documentLast4: "7F3K",
      documentKey,
      status: "PENDING",
    },
  });
  await prisma.ownerVerification.deleteMany({ where: { userId: owner3.id } });

  console.info(
    [
      `Seeded ${pgs.length} listings in ${cities.length} cities.`,
      `Logins (password "${PASSWORD}"):`,
      "  owner@pgconnect.dev   verified Pro owner + admin",
      "  owner2@pgconnect.dev  Growth owner, verification pending",
      "  owner3@pgconnect.dev  free-plan owner",
      "  tenant@pgconnect.dev  tenant with a shortlist, enquiries and a chat",
    ].join("\n")
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
