import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { LISTING_LIMITS, PLANS } from "@/lib/constants";
import { listingSchema, listingUpdateSchema } from "@/lib/validation";
import type { AuthUser } from "./auth/guard";
import { requireUser } from "./auth/guard";
import { badRequest, conflict, forbidden, notFound, ok, readJson, route } from "./http";
import { countOwnerListings, ensureCity } from "./listings";
import { enforceRateLimit } from "./rate-limit";
import { deleteListingImage, sniffFileType, uploadListingImage } from "./storage";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ListingStatusValue = "ACTIVE" | "PAUSED" | "BLOCKED";
export type LeadStatusValue = "NEW" | "CONTACTED" | "CLOSED";
export type LeadTypeValue = "CALLBACK" | "VISIT";

export type OwnerListingSummary = {
  id: string;
  name: string;
  city: string;
  locality: string | null;
  rentPerMonth: number;
  gender: "MALE" | "FEMALE" | "ANY";
  image: string | null;
  imageCount: number;
  status: ListingStatusValue;
  capacity: number;
  capacityCount: number;
  bedsAvailable: number;
  views: number;
  newLeads: number;
  totalLeads: number;
  unreadMessages: number;
  createdAt: string;
  updatedAt: string;
};

export type EditableListing = {
  id: string;
  name: string;
  contact: string;
  city: string;
  locality: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rentPerMonth: number;
  deposit: number;
  capacity: number;
  capacityCount: number;
  gender: "MALE" | "FEMALE" | "ANY";
  sharingTypes: number[];
  amenities: string[];
  foodIncluded: boolean;
  houseRules: string | null;
  noticePeriodDays: number | null;
  description: string;
  images: string[];
  status: ListingStatusValue;
  views: number;
  createdAt: string;
  updatedAt: string;
  stats: { views: number; totalLeads: number; newLeads: number; saves: number };
};

export type OwnerLead = {
  id: string;
  type: LeadTypeValue;
  status: LeadStatusValue;
  name: string | null;
  phoneNumber: string;
  message: string | null;
  visitDate: string | null;
  createdAt: string;
  pg: { id: string; name: string };
  user: { username: string };
};

export type OwnerOverview = {
  listings: { total: number; active: number; paused: number; blocked: number };
  views: number;
  leads: { new: number; total: number; last7Days: number };
  unreadMessages: number;
  plan: { id: "FREE" | "BASIC" | "PREMIUM"; name: string; listingLimit: number; used: number };
  verification: { status: "PENDING" | "APPROVED" | "REJECTED"; reviewNote: string | null } | null;
  photosOk: boolean;
  recentLeads: OwnerLead[];
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const pgIdSchema = z.string().uuid("Invalid listing id");

const editableSelect = {
  id: true,
  name: true,
  contact: true,
  city: true,
  locality: true,
  address: true,
  latitude: true,
  longitude: true,
  rentPerMonth: true,
  deposit: true,
  capacity: true,
  capacityCount: true,
  gender: true,
  sharingTypes: true,
  amenities: true,
  foodIncluded: true,
  houseRules: true,
  noticePeriodDays: true,
  description: true,
  images: true,
  status: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  owner: { select: { membership: true } },
} satisfies Prisma.PgSelect;

type EditableRow = Prisma.PgGetPayload<{ select: typeof editableSelect }>;

/** Loads a listing the user may manage (its owner, or an admin). 404 otherwise. */
export async function getManagedListing(user: AuthUser, pgId: string): Promise<EditableRow> {
  const id = pgIdSchema.safeParse(pgId);
  if (!id.success) throw notFound("Listing not found");
  const pg = await prisma.pg.findUnique({ where: { id: id.data }, select: editableSelect });
  if (!pg || (pg.ownerId !== user.id && !user.isAdmin)) throw notFound("Listing not found");
  return pg;
}

async function toEditableListing(row: EditableRow): Promise<EditableListing> {
  const [totalLeads, newLeads, saves] = await prisma.$transaction([
    prisma.lead.count({ where: { pgId: row.id } }),
    prisma.lead.count({ where: { pgId: row.id, status: "NEW" } }),
    prisma.favorite.count({ where: { pgId: row.id } }),
  ]);
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    city: row.city,
    locality: row.locality,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    rentPerMonth: row.rentPerMonth,
    deposit: row.deposit,
    capacity: row.capacity,
    capacityCount: row.capacityCount,
    gender: row.gender,
    sharingTypes: row.sharingTypes,
    amenities: row.amenities,
    foodIncluded: row.foodIncluded,
    houseRules: row.houseRules,
    noticePeriodDays: row.noticePeriodDays,
    description: row.description,
    images: row.images,
    status: row.status,
    views: row.views,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    stats: { views: row.views, totalLeads, newLeads, saves },
  };
}

export async function getEditableListing(user: AuthUser, pgId: string) {
  return toEditableListing(await getManagedListing(user, pgId));
}

function upgradeMessage(limit: number) {
  return `Your current plan allows ${limit} active listing${limit === 1 ? "" : "s"}. Upgrade your plan on the Plans & billing page to add more.`;
}

/* -------------------------------------------------------------------------- */
/*                               Become an owner                              */
/* -------------------------------------------------------------------------- */

export async function makeOwner(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { isOwner: true } });
}

/* -------------------------------------------------------------------------- */
/*                                 Create                                     */
/* -------------------------------------------------------------------------- */

const ARRAY_FIELDS = new Set(["sharingTypes", "amenities"]);

/** Converts multipart fields into a plain object listingSchema understands. */
function formToListingInput(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    if (key === "images") continue;
    const values = form.getAll(key).filter((v): v is string => typeof v === "string");
    if (values.length === 0) continue;
    if (ARRAY_FIELDS.has(key)) {
      out[key] = values.length === 1 ? values[0] : values;
    } else {
      out[key] = values[0];
    }
  }
  return out;
}

/** Validates image uploads (count, size, real type via magic bytes) without storing them. */
async function validateImages(files: File[], existingCount = 0, requireMin = true) {
  if (files.some((f) => !(f instanceof File))) throw badRequest("Invalid image upload");
  const total = existingCount + files.length;
  if (requireMin && total < LISTING_LIMITS.minImages) {
    throw badRequest(`Add at least ${LISTING_LIMITS.minImages} photos of your PG`);
  }
  if (total > LISTING_LIMITS.maxImages) {
    throw badRequest(`You can add up to ${LISTING_LIMITS.maxImages} photos per listing`);
  }
  const maxMb = Math.round(LISTING_LIMITS.maxImageBytes / (1024 * 1024));
  for (const file of files) {
    if (file.size === 0) throw badRequest("One of the photos is empty");
    if (file.size > LISTING_LIMITS.maxImageBytes) {
      throw badRequest(`Each photo must be under ${maxMb} MB`);
    }
    const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
    const type = sniffFileType(head);
    if (!type || !(LISTING_LIMITS.imageTypes as readonly string[]).includes(type.mime)) {
      throw badRequest("Photos must be JPG, PNG or WebP images");
    }
  }
}

/** Uploads in parallel; if any upload fails, removes the ones that succeeded. */
async function uploadAll(files: File[], ownerId: string): Promise<string[]> {
  const results = await Promise.allSettled(files.map((f) => uploadListingImage(f, ownerId)));
  const uploaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed) {
    await Promise.all(uploaded.map((url) => deleteListingImage(url)));
    throw failed.reason;
  }
  return uploaded;
}

export async function createListing(user: AuthUser, form: FormData) {
  const input = listingSchema.parse(formToListingInput(form));
  const files = form.getAll("images").filter((v): v is File => typeof v !== "string");
  await validateImages(files);

  const limit = PLANS[user.membership].listingLimit;
  if (!user.isAdmin && (await countOwnerListings(user.id)) >= limit) {
    throw forbidden(upgradeMessage(limit));
  }

  enforceRateLimit(`pg-post:${user.id}`, 10, 60 * 60 * 1000);

  const city = await ensureCity(input.city);
  const images = await uploadAll(files, user.id);
  try {
    const pg = await prisma.pg.create({
      data: { ...input, city, images, ownerId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    return pg;
  } catch (error) {
    await Promise.all(images.map((url) => deleteListingImage(url)));
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Update                                     */
/* -------------------------------------------------------------------------- */

export async function updateListing(user: AuthUser, pgId: string, body: unknown) {
  const pg = await getManagedListing(user, pgId);
  const input = listingUpdateSchema.parse(body);

  if (pg.status === "BLOCKED" && input.status !== undefined) {
    throw forbidden("This listing was blocked by moderation. Contact support to have it reviewed.");
  }

  const capacity = input.capacity ?? pg.capacity;
  const capacityCount = input.capacityCount ?? pg.capacityCount;
  if (capacityCount > capacity) throw badRequest("Occupied beds cannot exceed total beds");

  if (input.status === "ACTIVE" && pg.status !== "ACTIVE") {
    const limit = PLANS[pg.owner.membership].listingLimit;
    const active = await prisma.pg.count({
      where: { ownerId: pg.ownerId, status: "ACTIVE", id: { not: pg.id } },
    });
    if (active >= limit) throw forbidden(upgradeMessage(limit));
  }

  const data: Prisma.PgUpdateInput = { ...input };
  if (input.city !== undefined && input.city !== pg.city) {
    data.city = await ensureCity(input.city);
  }

  const updated = await prisma.pg.update({ where: { id: pg.id }, data, select: editableSelect });
  return toEditableListing(updated);
}

/**
 * Factory for the legacy PUT /api/dashboard/update/<field> endpoints. They accept
 * `{ pgId, ...fields }` and run the same validated partial update as PATCH.
 */
export function legacyUpdateRoute(fields: readonly string[]) {
  return route(async (req) => {
    const user = await requireUser(req, { owner: true });
    const body = z
      .object({ pgId: pgIdSchema })
      .passthrough()
      .parse(await readJson(req)) as { pgId: string } & Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const field of fields) {
      const value = body[field];
      if (value !== null && value !== undefined) patch[field] = value;
    }
    if (Object.keys(patch).length === 0) throw badRequest("Nothing to update");
    return ok(await updateListing(user, body.pgId, patch));
  });
}

/* -------------------------------------------------------------------------- */
/*                                 Delete                                     */
/* -------------------------------------------------------------------------- */

export async function deleteListing(user: AuthUser, pgId: string) {
  const pg = await getManagedListing(user, pgId);
  await prisma.pg.delete({ where: { id: pg.id } });
  await Promise.all(pg.images.map((url) => deleteListingImage(url)));
  return { id: pg.id };
}

/* -------------------------------------------------------------------------- */
/*                                 Images                                     */
/* -------------------------------------------------------------------------- */

/** Writes the new images array only if nobody changed it in the meantime. */
async function commitImages(pgId: string, previous: string[], next: string[]) {
  const result = await prisma.pg.updateMany({
    where: { id: pgId, images: { equals: previous } },
    data: { images: next },
  });
  if (result.count === 0) {
    throw conflict("Photos were changed in another tab. Refresh the page and try again.");
  }
}

export async function addListingImages(user: AuthUser, pgId: string, files: File[]) {
  const pg = await getManagedListing(user, pgId);
  if (files.length === 0) throw badRequest("Choose at least one photo");
  await validateImages(files, pg.images.length, false);
  enforceRateLimit(`pg-images:${user.id}`, 60, 60 * 60 * 1000);

  const uploaded = await uploadAll(files, pg.ownerId);
  const next = [...pg.images, ...uploaded];
  try {
    await commitImages(pg.id, pg.images, next);
  } catch (error) {
    await Promise.all(uploaded.map((url) => deleteListingImage(url)));
    throw error;
  }
  return { images: next };
}

export async function removeListingImage(user: AuthUser, pgId: string, imageUrl: string) {
  const pg = await getManagedListing(user, pgId);
  if (!pg.images.includes(imageUrl)) throw notFound("Photo not found on this listing");
  if (pg.images.length - 1 < LISTING_LIMITS.minImages) {
    throw badRequest(`A listing needs at least ${LISTING_LIMITS.minImages} photos. Add another photo before removing this one.`);
  }
  const next = pg.images.filter((url) => url !== imageUrl);
  await commitImages(pg.id, pg.images, next);
  await deleteListingImage(imageUrl);
  return { images: next };
}

export async function reorderListingImages(user: AuthUser, pgId: string, images: string[]) {
  const pg = await getManagedListing(user, pgId);
  const current = new Set(pg.images);
  const isPermutation =
    images.length === pg.images.length &&
    new Set(images).size === images.length &&
    images.every((url) => current.has(url));
  if (!isPermutation) throw badRequest("Photo order does not match this listing's photos. Refresh and try again.");
  await commitImages(pg.id, pg.images, images);
  return { images };
}

/* -------------------------------------------------------------------------- */
/*                              Listings overview                             */
/* -------------------------------------------------------------------------- */

/** Unread tenant messages per listing for one owner (single aggregate query). */
async function unreadByListing(ownerId: string): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<{ pgId: string; count: bigint }[]>`
    SELECT cr."pgId" AS "pgId", COUNT(*)::bigint AS "count"
    FROM "Message" m
    JOIN "ChatRoom" cr ON cr."id" = m."chatRoomId"
    JOIN "Pg" p ON p."id" = cr."pgId"
    WHERE p."ownerId" = ${ownerId}
      AND m."status" = 'SENT'
      AND m."senderId" <> ${ownerId}
    GROUP BY cr."pgId"`;
  return new Map(rows.map((r) => [r.pgId, Number(r.count)]));
}

export async function getOwnerListings(ownerId: string): Promise<OwnerListingSummary[]> {
  const [rows, leadGroups, unread] = await Promise.all([
    prisma.pg.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        city: true,
        locality: true,
        rentPerMonth: true,
        gender: true,
        images: true,
        status: true,
        capacity: true,
        capacityCount: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.lead.groupBy({
      by: ["pgId", "status"],
      where: { pg: { ownerId } },
      _count: { _all: true },
    }),
    unreadByListing(ownerId),
  ]);

  const leadCounts = new Map<string, { total: number; fresh: number }>();
  for (const g of leadGroups) {
    const entry = leadCounts.get(g.pgId) ?? { total: 0, fresh: 0 };
    entry.total += g._count._all;
    if (g.status === "NEW") entry.fresh += g._count._all;
    leadCounts.set(g.pgId, entry);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    locality: row.locality,
    rentPerMonth: row.rentPerMonth,
    gender: row.gender,
    image: row.images[0] ?? null,
    imageCount: row.images.length,
    status: row.status,
    capacity: row.capacity,
    capacityCount: row.capacityCount,
    bedsAvailable: Math.max(0, row.capacity - row.capacityCount),
    views: row.views,
    newLeads: leadCounts.get(row.id)?.fresh ?? 0,
    totalLeads: leadCounts.get(row.id)?.total ?? 0,
    unreadMessages: unread.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*                                   Leads                                    */
/* -------------------------------------------------------------------------- */

const leadSelect = {
  id: true,
  type: true,
  status: true,
  name: true,
  phoneNumber: true,
  message: true,
  visitDate: true,
  createdAt: true,
  pg: { select: { id: true, name: true } },
  user: { select: { username: true } },
} satisfies Prisma.LeadSelect;

function toOwnerLead(row: Prisma.LeadGetPayload<{ select: typeof leadSelect }>): OwnerLead {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    name: row.name,
    phoneNumber: row.phoneNumber,
    message: row.message,
    visitDate: row.visitDate?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    pg: row.pg,
    user: row.user,
  };
}

export const leadsQuerySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]).optional(),
  pgId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function getOwnerLeads(ownerId: string, query: z.infer<typeof leadsQuerySchema>) {
  const where: Prisma.LeadWhereInput = {
    pg: { ownerId },
    ...(query.status ? { status: query.status } : {}),
    ...(query.pgId ? { pgId: query.pgId } : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      select: leadSelect,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    }),
  ]);
  return {
    items: rows.map(toOwnerLead),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function updateLeadStatus(ownerId: string, leadId: string, status: LeadStatusValue) {
  const id = z.string().uuid().safeParse(leadId);
  if (!id.success) throw notFound("Lead not found");
  const lead = await prisma.lead.findUnique({
    where: { id: id.data },
    select: { id: true, pg: { select: { ownerId: true } } },
  });
  if (!lead || lead.pg.ownerId !== ownerId) throw notFound("Lead not found");
  const updated = await prisma.lead.update({ where: { id: lead.id }, data: { status }, select: leadSelect });
  return toOwnerLead(updated);
}

/* -------------------------------------------------------------------------- */
/*                                  Overview                                  */
/* -------------------------------------------------------------------------- */

export async function getOwnerOverview(user: AuthUser): Promise<OwnerOverview> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const leadWhere: Prisma.LeadWhereInput = { pg: { ownerId: user.id } };

  const [statusGroups, viewsAgg, newLeads, totalLeads, recentCount, unreadMessages, verification, recent, thinPhotos] =
    await Promise.all([
      prisma.pg.groupBy({ by: ["status"], where: { ownerId: user.id }, _count: { _all: true } }),
      prisma.pg.aggregate({ where: { ownerId: user.id }, _sum: { views: true } }),
      prisma.lead.count({ where: { ...leadWhere, status: "NEW" } }),
      prisma.lead.count({ where: leadWhere }),
      prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: sevenDaysAgo } } }),
      prisma.message.count({
        where: { status: "SENT", senderId: { not: user.id }, chatRoom: { pg: { ownerId: user.id } } },
      }),
      prisma.ownerVerification.findUnique({
        where: { userId: user.id },
        select: { status: true, reviewNote: true },
      }),
      prisma.lead.findMany({ where: leadWhere, select: leadSelect, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS "count" FROM "Pg"
        WHERE "ownerId" = ${user.id} AND "status" <> 'BLOCKED' AND COALESCE(array_length("images", 1), 0) < 6`,
    ]);

  const byStatus = { ACTIVE: 0, PAUSED: 0, BLOCKED: 0 } as Record<ListingStatusValue, number>;
  for (const g of statusGroups) byStatus[g.status] = g._count._all;
  const total = byStatus.ACTIVE + byStatus.PAUSED + byStatus.BLOCKED;
  const plan = PLANS[user.membership];

  return {
    listings: { total, active: byStatus.ACTIVE, paused: byStatus.PAUSED, blocked: byStatus.BLOCKED },
    views: viewsAgg._sum.views ?? 0,
    leads: { new: newLeads, total: totalLeads, last7Days: recentCount },
    unreadMessages,
    plan: {
      id: plan.id,
      name: plan.name,
      listingLimit: plan.listingLimit,
      used: byStatus.ACTIVE + byStatus.PAUSED,
    },
    verification,
    photosOk: total > 0 && Number(thinPhotos[0]?.count ?? 0) === 0,
    recentLeads: recent.map(toOwnerLead),
  };
}
