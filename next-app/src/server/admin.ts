import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { Paginated } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

export const ADMIN_PAGE_SIZE = 20;

const pageSchema = z.coerce.number().int().min(1).max(1000).default(1);
const qSchema = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));

export function queryObject(req: Request): Record<string, string> {
  return Object.fromEntries(new URL(req.url).searchParams.entries());
}

function paginate<T>(items: T[], total: number, page: number, limit = ADMIN_PAGE_SIZE): Paginated<T> {
  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

const sevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

export type AdminOverview = {
  users: number;
  owners: number;
  bannedUsers: number;
  listings: { total: number; ACTIVE: number; PAUSED: number; BLOCKED: number };
  pendingVerifications: number;
  openReports: number;
  last7Days: { leads: number; messages: number; newUsers: number; newListings: number };
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const since = sevenDaysAgo();
  const [users, owners, bannedUsers, byStatus, pendingVerifications, openReports, leads, messages, newUsers, newListings] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isOwner: true } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.pg.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
      prisma.ownerVerification.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.message.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.pg.count({ where: { createdAt: { gte: since } } }),
    ]);

  const listings = { total: 0, ACTIVE: 0, PAUSED: 0, BLOCKED: 0 };
  for (const row of byStatus) {
    const count = typeof row._count === "object" && row._count ? (row._count._all ?? 0) : 0;
    listings[row.status] = count;
    listings.total += count;
  }

  return {
    users,
    owners,
    bannedUsers,
    listings,
    pendingVerifications,
    openReports,
    last7Days: { leads, messages, newUsers, newListings },
  };
}

/* ------------------------------------------------------------------ */
/* Owner verifications                                                 */
/* ------------------------------------------------------------------ */

export const verificationListQuery = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  page: pageSchema,
});

export const verificationDecisionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    note: z
      .string()
      .trim()
      .max(500, "Keep the note under 500 characters")
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((v) => v.status !== "REJECTED" || Boolean(v.note), {
    message: "Add a note so the owner knows what to fix",
    path: ["note"],
  });

export type AdminVerification = {
  id: string;
  user: { id: string; username: string; email: string };
  fullName: string;
  documentType: string;
  documentLast4: string;
  hasDocument: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const verificationSelect = {
  id: true,
  fullName: true,
  documentType: true,
  documentLast4: true,
  documentKey: true,
  status: true,
  reviewNote: true,
  createdAt: true,
  reviewedAt: true,
  user: { select: { id: true, username: true, email: true } },
} satisfies Prisma.OwnerVerificationSelect;

type VerificationRow = Prisma.OwnerVerificationGetPayload<{ select: typeof verificationSelect }>;

export function toAdminVerification(row: VerificationRow): AdminVerification {
  return {
    id: row.id,
    user: row.user,
    fullName: row.fullName,
    documentType: row.documentType,
    documentLast4: row.documentLast4,
    hasDocument: Boolean(row.documentKey),
    status: row.status,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

export async function listVerifications(input: z.infer<typeof verificationListQuery>) {
  const where: Prisma.OwnerVerificationWhereInput = { status: input.status };
  const [rows, total] = await prisma.$transaction([
    prisma.ownerVerification.findMany({
      where,
      select: verificationSelect,
      // Oldest pending first (FIFO queue); most recent decisions first otherwise.
      orderBy: { createdAt: input.status === "PENDING" ? "asc" : "desc" },
      skip: (input.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.ownerVerification.count({ where }),
  ]);
  return paginate(rows.map(toAdminVerification), total, input.page);
}

export function findVerification(id: string) {
  return prisma.ownerVerification.findUnique({ where: { id }, select: verificationSelect });
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export const reportListQuery = z.object({
  status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]).default("OPEN"),
  page: pageSchema,
});

export const reportDecisionSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  blockListing: z.boolean().optional().default(false),
});

export type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: { username: string };
  pg: {
    id: string;
    name: string;
    city: string;
    status: "ACTIVE" | "PAUSED" | "BLOCKED";
    owner: { username: string };
  };
};

const reportSelect = {
  id: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  user: { select: { username: true } },
  pg: {
    select: {
      id: true,
      name: true,
      city: true,
      status: true,
      owner: { select: { username: true } },
    },
  },
} satisfies Prisma.ReportSelect;

type ReportRow = Prisma.ReportGetPayload<{ select: typeof reportSelect }>;

function toAdminReport(row: ReportRow): AdminReport {
  return {
    id: row.id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    reporter: { username: row.user.username },
    pg: row.pg,
  };
}

export async function listReports(input: z.infer<typeof reportListQuery>) {
  const where: Prisma.ReportWhereInput = { status: input.status };
  const [rows, total] = await prisma.$transaction([
    prisma.report.findMany({
      where,
      select: reportSelect,
      orderBy: { createdAt: input.status === "OPEN" ? "asc" : "desc" },
      skip: (input.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.report.count({ where }),
  ]);
  return paginate(rows.map(toAdminReport), total, input.page);
}

export async function decideReport(id: string, input: z.infer<typeof reportDecisionSchema>) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.report.update({ where: { id }, data: { status: input.status }, select: { pgId: true } });
    if (input.blockListing) {
      await tx.pg.update({ where: { id: report.pgId }, data: { status: "BLOCKED" } });
      // Blocking a listing settles every open report against it.
      await tx.report.updateMany({
        where: { pgId: report.pgId, status: "OPEN" },
        data: { status: "RESOLVED" },
      });
    }
    const row = await tx.report.findUniqueOrThrow({ where: { id }, select: reportSelect });
    return toAdminReport(row);
  });
}

/* ------------------------------------------------------------------ */
/* Listings                                                            */
/* ------------------------------------------------------------------ */

export const listingListQuery = z.object({
  q: qSchema,
  status: z.enum(["ACTIVE", "PAUSED", "BLOCKED"]).optional(),
  page: pageSchema,
});

export const listingStatusSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED", "BLOCKED"]) });

export type AdminListing = {
  id: string;
  name: string;
  city: string;
  locality: string | null;
  rentPerMonth: number;
  status: "ACTIVE" | "PAUSED" | "BLOCKED";
  image: string | null;
  views: number;
  createdAt: string;
  owner: { id: string; username: string; email: string; isBanned: boolean };
  openReports: number;
};

const listingSelect = {
  id: true,
  name: true,
  city: true,
  locality: true,
  rentPerMonth: true,
  status: true,
  images: true,
  views: true,
  createdAt: true,
  owner: { select: { id: true, username: true, email: true, isBanned: true } },
  _count: { select: { reports: { where: { status: "OPEN" } } } },
} satisfies Prisma.PgSelect;

type ListingRow = Prisma.PgGetPayload<{ select: typeof listingSelect }>;

function toAdminListing(row: ListingRow): AdminListing {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    locality: row.locality,
    rentPerMonth: row.rentPerMonth,
    status: row.status,
    image: row.images[0] ?? null,
    views: row.views,
    createdAt: row.createdAt.toISOString(),
    owner: row.owner,
    openReports: row._count.reports,
  };
}

export async function listListings(input: z.infer<typeof listingListQuery>) {
  const and: Prisma.PgWhereInput[] = [];
  if (input.status) and.push({ status: input.status });
  if (input.q) {
    const term = input.q;
    and.push({
      OR: [
        { id: term },
        { name: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { locality: { contains: term, mode: "insensitive" } },
        { owner: { email: { contains: term, mode: "insensitive" } } },
        { owner: { username: { contains: term, mode: "insensitive" } } },
      ],
    });
  }
  const where: Prisma.PgWhereInput = and.length ? { AND: and } : {};
  const [rows, total] = await prisma.$transaction([
    prisma.pg.findMany({
      where,
      select: listingSelect,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.pg.count({ where }),
  ]);
  return paginate(rows.map(toAdminListing), total, input.page);
}

export async function setListingStatus(id: string, status: AdminListing["status"]) {
  const row = await prisma.pg.update({ where: { id }, data: { status }, select: listingSelect });
  return toAdminListing(row);
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const userListQuery = z.object({ q: qSchema, page: pageSchema });
export const userBanSchema = z.object({ isBanned: z.boolean() });

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  isOwner: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isVerified: boolean;
  membership: "FREE" | "BASIC" | "PREMIUM";
  createdAt: string;
  listingCount: number;
};

const userSelect = {
  id: true,
  username: true,
  email: true,
  isOwner: true,
  isAdmin: true,
  isBanned: true,
  isVerified: true,
  membership: true,
  createdAt: true,
  _count: { select: { Pg: true } },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export function toAdminUser(row: UserRow, adminEmails: string[]): AdminUserRow {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    isOwner: row.isOwner,
    isAdmin: row.isAdmin || adminEmails.includes(row.email.toLowerCase()),
    isBanned: row.isBanned,
    isVerified: row.isVerified,
    membership: row.membership,
    createdAt: row.createdAt.toISOString(),
    listingCount: row._count.Pg,
  };
}

export async function listUsers(input: z.infer<typeof userListQuery>, adminEmails: string[]) {
  const where: Prisma.UserWhereInput = input.q
    ? {
        OR: [
          { id: input.q },
          { username: { contains: input.q, mode: "insensitive" } },
          { email: { contains: input.q, mode: "insensitive" } },
        ],
      }
    : {};
  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);
  return paginate(
    rows.map((r) => toAdminUser(r, adminEmails)),
    total,
    input.page
  );
}

export function findUserForAdmin(id: string) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

export async function setUserBanned(id: string, isBanned: boolean) {
  return prisma.user.update({ where: { id }, data: { isBanned }, select: userSelect });
}

/** Validates a path id parameter (all our ids are UUIDs). */
export const idParam = z.string().uuid("Invalid id");
