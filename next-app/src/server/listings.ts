import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/constants";
import type { SearchParams } from "@/lib/validation";

export const pgCardSelect = {
  id: true,
  name: true,
  city: true,
  locality: true,
  address: true,
  rentPerMonth: true,
  deposit: true,
  gender: true,
  sharingTypes: true,
  amenities: true,
  foodIncluded: true,
  images: true,
  capacity: true,
  capacityCount: true,
  avgRating: true,
  reviewCount: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  owner: {
    select: { membership: true, verification: { select: { status: true } } },
  },
} satisfies Prisma.PgSelect;

type PgCardRow = Prisma.PgGetPayload<{ select: typeof pgCardSelect }>;

export type PgCard = {
  id: string;
  name: string;
  city: string;
  locality: string | null;
  address: string;
  rentPerMonth: number;
  deposit: number;
  gender: "MALE" | "FEMALE" | "ANY";
  sharingTypes: number[];
  amenities: string[];
  foodIncluded: boolean;
  image: string | null;
  imageCount: number;
  bedsAvailable: number;
  avgRating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  isVerifiedOwner: boolean;
  isFeatured: boolean;
  createdAt: string;
  distanceKm?: number;
};

export function toPgCard(row: PgCardRow, distanceKm?: number): PgCard {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    locality: row.locality,
    address: row.address,
    rentPerMonth: row.rentPerMonth,
    deposit: row.deposit,
    gender: row.gender,
    sharingTypes: row.sharingTypes,
    amenities: row.amenities,
    foodIncluded: row.foodIncluded,
    image: row.images[0] ?? null,
    imageCount: row.images.length,
    bedsAvailable: Math.max(0, row.capacity - row.capacityCount),
    avgRating: Math.round(row.avgRating * 10) / 10,
    reviewCount: row.reviewCount,
    latitude: row.latitude,
    longitude: row.longitude,
    isVerifiedOwner: row.owner.verification?.status === "APPROVED",
    isFeatured: row.owner.membership === "PREMIUM",
    createdAt: row.createdAt.toISOString(),
    ...(distanceKm !== undefined ? { distanceKm: Math.round(distanceKm * 10) / 10 } : {}),
  };
}

const IGNORED_PLACE_PARTS = new Set(["india", "in", "bharat"]);

/** Splits a free-text / Google Places query into its meaningful parts. */
export function parsePlaceQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(",")
    .map((p) => p.replace(/\b\d{6}\b/g, "").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 1 && !IGNORED_PLACE_PARTS.has(p));
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function textMatch(term: string): Prisma.PgWhereInput {
  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { locality: { contains: term, mode: "insensitive" } },
      { address: { contains: term, mode: "insensitive" } },
      { city: { contains: term, mode: "insensitive" } },
    ],
  };
}

export async function buildSearchWhere(params: SearchParams): Promise<Prisma.PgWhereInput> {
  const and: Prisma.PgWhereInput[] = [{ status: "ACTIVE" }, { owner: { isBanned: false } }];

  if (params.city) and.push({ city: params.city.toLowerCase() });

  if (params.q) {
    const parts = parsePlaceQuery(params.q);
    if (parts.length > 0) {
      let cityPart: string | undefined;
      if (!params.city) {
        const knownCity = await prisma.city.findFirst({
          where: { name: { in: parts } },
          select: { name: true },
        });
        cityPart = knownCity?.name;
        if (cityPart) and.push({ city: cityPart });
      }
      const specific = parts.find((p) => p !== cityPart && p !== params.city?.toLowerCase());
      if (specific) and.push(textMatch(specific));
    }
  }

  if (params.gender) {
    // Co-living PGs accept everyone, so include them for gender-specific searches.
    and.push({ gender: { in: params.gender === "ANY" ? ["ANY"] : [params.gender, "ANY"] } });
  }
  if (params.sharing) and.push({ sharingTypes: { has: params.sharing } });
  if (params.minRent !== undefined || params.maxRent !== undefined) {
    and.push({
      rentPerMonth: {
        ...(params.minRent !== undefined ? { gte: params.minRent } : {}),
        ...(params.maxRent !== undefined ? { lte: params.maxRent } : {}),
      },
    });
  }
  if (params.amenities.length > 0) and.push({ amenities: { hasEvery: params.amenities } });
  if (params.food !== undefined) and.push({ foodIncluded: params.food });
  if (params.verified) and.push({ owner: { verification: { status: "APPROVED" } } });

  if (params.lat !== undefined && params.lng !== undefined) {
    const latDelta = params.radiusKm / 111;
    const lngDelta = params.radiusKm / (111 * Math.max(0.2, Math.cos((params.lat * Math.PI) / 180)));
    and.push({
      latitude: { gte: params.lat - latDelta, lte: params.lat + latDelta },
      longitude: { gte: params.lng - lngDelta, lte: params.lng + lngDelta },
    });
  }

  return { AND: and };
}

function orderFor(sort: SearchParams["sort"]): Prisma.PgOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price_asc":
      return [{ rentPerMonth: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ rentPerMonth: "desc" }, { createdAt: "desc" }];
    case "rating":
      return [{ avgRating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }];
    default:
      // Paid plans get priority placement, then fresh listings.
      return [{ owner: { membership: "desc" } }, { reviewCount: "desc" }, { createdAt: "desc" }];
  }
}

export type SearchResult = {
  items: PgCard[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function searchListings(params: SearchParams): Promise<SearchResult> {
  const where = await buildSearchWhere(params);
  const hasPoint = params.lat !== undefined && params.lng !== undefined;

  // available=true: only listings with at least one free bed (column comparison).
  const finalWhere: Prisma.PgWhereInput = params.available
    ? { AND: [where, { capacityCount: { lt: prisma.pg.fields.capacity } }] }
    : where;

  if (hasPoint && (params.sort === "distance" || params.sort === "recommended")) {
    const rows = await prisma.pg.findMany({ where: finalWhere, select: pgCardSelect, take: 500 });
    const withDistance = rows
      .map((row) => ({
        row,
        distance:
          row.latitude !== null && row.longitude !== null
            ? haversineKm(params.lat!, params.lng!, row.latitude, row.longitude)
            : Number.POSITIVE_INFINITY,
      }))
      .filter((r) => r.distance <= params.radiusKm)
      .sort((a, b) => a.distance - b.distance);
    const total = withDistance.length;
    const start = (params.page - 1) * params.limit;
    return {
      items: withDistance.slice(start, start + params.limit).map((r) => toPgCard(r.row, r.distance)),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  const [total, rows] = await prisma.$transaction([
    prisma.pg.count({ where: finalWhere }),
    prisma.pg.findMany({
      where: finalWhere,
      select: pgCardSelect,
      orderBy: orderFor(params.sort),
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
  ]);

  return {
    items: rows.map((row) =>
      toPgCard(
        row,
        hasPoint && row.latitude !== null && row.longitude !== null
          ? haversineKm(params.lat!, params.lng!, row.latitude, row.longitude)
          : undefined
      )
    ),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export const pgDetailSelect = {
  ...pgCardSelect,
  description: true,
  houseRules: true,
  noticePeriodDays: true,
  status: true,
  views: true,
  updatedAt: true,
  ownerId: true,
  owner: {
    select: {
      id: true,
      username: true,
      createdAt: true,
      membership: true,
      verification: { select: { status: true } },
    },
  },
} satisfies Prisma.PgSelect;

export type PgDetail = PgCard & {
  images: string[];
  description: string;
  houseRules: string | null;
  noticePeriodDays: number | null;
  capacity: number;
  status: "ACTIVE" | "PAUSED" | "BLOCKED";
  views: number;
  updatedAt: string;
  owner: { id: string; username: string; memberSince: string; isVerified: boolean };
};

export async function getListingDetail(id: string): Promise<PgDetail | null> {
  const row = await prisma.pg.findUnique({ where: { id }, select: pgDetailSelect });
  if (!row) return null;
  return {
    ...toPgCard(row),
    images: row.images,
    description: row.description,
    houseRules: row.houseRules,
    noticePeriodDays: row.noticePeriodDays,
    capacity: row.capacity,
    status: row.status,
    views: row.views,
    updatedAt: row.updatedAt.toISOString(),
    owner: {
      id: row.owner.id,
      username: row.owner.username,
      memberSince: row.owner.createdAt.toISOString(),
      isVerified: row.owner.verification?.status === "APPROVED",
    },
  };
}

export async function getSimilarListings(pg: { id: string; city: string; rentPerMonth: number; gender: string }) {
  const rows = await prisma.pg.findMany({
    where: {
      status: "ACTIVE",
      city: pg.city,
      id: { not: pg.id },
      rentPerMonth: { gte: pg.rentPerMonth * 0.6, lte: pg.rentPerMonth * 1.5 },
      owner: { isBanned: false },
    },
    select: pgCardSelect,
    orderBy: [{ owner: { membership: "desc" } }, { createdAt: "desc" }],
    take: 4,
  });
  return rows.map((r) => toPgCard(r));
}

export function listingLimitFor(plan: PlanId) {
  return PLANS[plan].listingLimit;
}

/** Counts listings that occupy a plan slot (everything except admin-blocked). */
export async function countOwnerListings(ownerId: string) {
  return prisma.pg.count({ where: { ownerId, status: { not: "BLOCKED" } } });
}

export async function ensureCity(name: string) {
  const city = name.trim().toLowerCase();
  await prisma.city.upsert({ where: { name: city }, create: { name: city }, update: {} });
  return city;
}

export async function getPlatformStats() {
  const [listings, cities, beds] = await prisma.$transaction([
    prisma.pg.count({ where: { status: "ACTIVE" } }),
    prisma.pg.findMany({ where: { status: "ACTIVE" }, distinct: ["city"], select: { city: true } }),
    prisma.pg.aggregate({ where: { status: "ACTIVE" }, _sum: { capacity: true } }),
  ]);
  return { listings, cities: cities.length, beds: beds._sum.capacity ?? 0 };
}

export async function getCityCounts(limit = 24) {
  const rows = await prisma.pg.groupBy({
    by: ["city"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    orderBy: { _count: { city: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ city: r.city, count: r._count._all }));
}

/** Recomputes the denormalised rating summary on a listing. */
export async function refreshRating(pgId: string) {
  const agg = await prisma.review.aggregate({
    where: { pgId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.pg.update({
    where: { id: pgId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count._all },
  });
}
