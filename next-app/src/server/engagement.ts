import "server-only";
import prisma from "@/lib/prisma";
import type {
  ReviewItem,
  ReviewPage,
  ReviewSummary,
  ViewerState,
} from "@/components/listing/types";
import { GUEST_VIEWER } from "@/components/listing/types";
import { notFound } from "./http";
import type { AuthUser } from "./auth/guard";

/**
 * Tenant-side engagement helpers for a single listing: visibility checks,
 * viewer state (saved / reviewed / enquired) and review queries.
 */

export type PgAccess = {
  id: string;
  name: string;
  ownerId: string;
  status: "ACTIVE" | "PAUSED" | "BLOCKED";
  ownerBanned: boolean;
};

export async function getPgAccess(pgId: string): Promise<PgAccess | null> {
  const pg = await prisma.pg.findUnique({
    where: { id: pgId },
    select: { id: true, name: true, ownerId: true, status: true, owner: { select: { isBanned: true } } },
  });
  if (!pg) return null;
  return { id: pg.id, name: pg.name, ownerId: pg.ownerId, status: pg.status, ownerBanned: pg.owner.isBanned };
}

/** Listing that tenants are allowed to interact with (not blocked, owner not banned). */
export async function requireInteractablePg(pgId: string): Promise<PgAccess> {
  const pg = await getPgAccess(pgId);
  if (!pg || pg.status === "BLOCKED" || pg.ownerBanned) throw notFound("PG not found");
  return pg;
}

/** True when the user has talked to the owner (chat) or sent a callback / visit request. */
export async function hasEngagement(userId: string, pgId: string): Promise<boolean> {
  const [chat, lead] = await Promise.all([
    prisma.chatRoom.findUnique({ where: { pgId_userId: { pgId, userId } }, select: { id: true } }),
    prisma.lead.findFirst({ where: { pgId, userId }, select: { id: true } }),
  ]);
  return Boolean(chat || lead);
}

export async function getViewerState(pg: PgAccess, user: AuthUser | null): Promise<ViewerState> {
  if (!user) return GUEST_VIEWER;
  const isOwner = pg.ownerId === user.id;

  const [favorite, review, leads, chat] = await Promise.all([
    prisma.favorite.findUnique({
      where: { userId_pgId: { userId: user.id, pgId: pg.id } },
      select: { pgId: true },
    }),
    prisma.review.findUnique({
      where: { pgId_userId: { pgId: pg.id, userId: user.id } },
      select: { rating: true, comment: true },
    }),
    prisma.lead.findMany({
      where: { pgId: pg.id, userId: user.id },
      select: { type: true, status: true, createdAt: true, visitDate: true },
    }),
    prisma.chatRoom.findUnique({
      where: { pgId_userId: { pgId: pg.id, userId: user.id } },
      select: { id: true },
    }),
  ]);

  const state: ViewerState = {
    saved: Boolean(favorite),
    myReview: review,
    leads: {},
    chatId: chat?.id ?? null,
    canReview: !isOwner && Boolean(chat || leads.length > 0),
    isOwner,
  };
  for (const lead of leads) {
    if (lead.type === "CALLBACK") {
      state.leads.CALLBACK = { status: lead.status, createdAt: lead.createdAt.toISOString() };
    } else {
      state.leads.VISIT = { status: lead.status, visitDate: lead.visitDate?.toISOString() ?? null };
    }
  }
  return state;
}

export async function getReviewSummary(pgId: string): Promise<ReviewSummary> {
  const groups = await prisma.review.groupBy({
    by: ["rating"],
    where: { pgId },
    _count: { _all: true },
    orderBy: { rating: "asc" },
  });
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const g of groups) {
    const rating = Math.min(5, Math.max(1, g.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[rating] += g._count._all;
    total += g._count._all;
    sum += g.rating * g._count._all;
  }
  return {
    avgRating: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    reviewCount: total,
    distribution,
  };
}

export const REVIEWS_PER_PAGE = 10;

export async function getReviewPage(pgId: string, page = 1, limit = REVIEWS_PER_PAGE): Promise<ReviewPage> {
  const [summary, rows] = await Promise.all([
    getReviewSummary(pgId),
    prisma.review.findMany({
      where: { pgId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
  ]);
  const items: ReviewItem[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    user: { username: r.user.username },
  }));
  return {
    items,
    summary,
    pagination: {
      page,
      limit,
      total: summary.reviewCount,
      totalPages: Math.max(1, Math.ceil(summary.reviewCount / limit)),
    },
  };
}
