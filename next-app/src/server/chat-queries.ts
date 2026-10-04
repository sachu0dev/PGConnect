import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { messageSchema } from "@/lib/validation";
import { createMessage, emitRealtime, getChatForParticipant, type ChatMessage } from "./chat";
import { badRequest, forbidden, notFound } from "./http";
import { enforceRateLimit } from "./rate-limit";

/* ------------------------------------------------------------------ */
/* Shapes returned by the chat API (imported with `import type` by UI) */
/* ------------------------------------------------------------------ */

export type ChatRole = "tenant" | "owner";

export type ChatInboxItem = {
  id: string;
  role: ChatRole;
  counterpart: { id: string; username: string };
  pg: { id: string; name: string; city: string; locality: string | null; image: string | null };
  lastMessage: { text: string; senderId: string; createdAt: string } | null;
  unread: number;
  lastMessageAt: string;
};

export type ChatInboxPage = { items: ChatInboxItem[]; nextCursor: string | null };

export type ChatRoomMeta = {
  id: string;
  role: ChatRole;
  counterpart: { id: string; username: string };
  pg: {
    id: string;
    name: string;
    city: string;
    locality: string | null;
    rentPerMonth: number;
    image: string | null;
    href: string;
    isActive: boolean;
  };
  /** False when either side can no longer message (e.g. a suspended account). */
  canSend: boolean;
  blockedReason: string | null;
};

export type ChatMessagesPage = { items: ChatMessage[]; hasMore: boolean };

/* ------------------------------------------------------------------ */
/* Limits & validation                                                 */
/* ------------------------------------------------------------------ */

export const MESSAGE_RATE_LIMIT = { limit: 30, windowMs: 60_000 } as const;
export const ROOM_RATE_LIMIT = { limit: 30, windowMs: 60 * 60_000 } as const;

export const inboxQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(80).optional(),
});

export const messagesQuerySchema = z.object({
  before: z.string().trim().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const idParamSchema = z.string().trim().min(1).max(64);

// C0/C1 control characters except \t and \n, plus bidi overrides / zero-width
// characters that are commonly abused to spoof or hide text.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

/** Normalises user-supplied chat text; throws 400 if nothing meaningful is left. */
export function sanitizeMessageText(input: string): string {
  const text = input
    .replace(/\r\n?/g, "\n")
    .replace(UNSAFE_CHARS, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  if (!text) throw badRequest("Message cannot be empty");
  return messageSchema.parse({ text }).text;
}

/* ------------------------------------------------------------------ */
/* Room lifecycle                                                      */
/* ------------------------------------------------------------------ */

/**
 * Gets or creates the conversation between `userId` (tenant) and the owner of
 * `pgId`, optionally sending a first message. Used by POST /api/pg/[id]/chat
 * and the legacy /api/pg/send-message adapter.
 */
export async function startChat(userId: string, pgId: string, message?: string) {
  const pg = await prisma.pg.findUnique({
    where: { id: pgId },
    select: { id: true, status: true, ownerId: true, owner: { select: { isBanned: true } } },
  });
  if (!pg) throw notFound("PG not found");
  if (pg.ownerId === userId) throw badRequest("This is your own listing");

  const text = message === undefined ? undefined : sanitizeMessageText(message);

  let room = await prisma.chatRoom.findUnique({
    where: { pgId_userId: { pgId, userId } },
    select: { id: true },
  });
  let created = false;

  if (!room) {
    if (pg.status !== "ACTIVE") throw badRequest("This PG is not accepting enquiries right now");
    if (pg.owner.isBanned) throw badRequest("This owner is not available on PGConnect right now");
    enforceRateLimit(`chat:room:${userId}`, ROOM_RATE_LIMIT.limit, ROOM_RATE_LIMIT.windowMs);
    try {
      room = await prisma.chatRoom.create({ data: { pgId, userId }, select: { id: true } });
      created = true;
    } catch (error) {
      // Two concurrent requests raced to create the same room: use the winner.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        room = await prisma.chatRoom.findUniqueOrThrow({
          where: { pgId_userId: { pgId, userId } },
          select: { id: true },
        });
      } else {
        throw error;
      }
    }
  }

  let firstMessage: ChatMessage | null = null;
  if (text) {
    if (pg.owner.isBanned) throw badRequest("This owner is not available on PGConnect right now");
    enforceRateLimit(`chat:msg:${userId}`, MESSAGE_RATE_LIMIT.limit, MESSAGE_RATE_LIMIT.windowMs);
    firstMessage = await createMessage(room.id, userId, pg.ownerId, text);
  }

  return { chatId: room.id, created, message: firstMessage };
}

type Participant = Awaited<ReturnType<typeof getChatForParticipant>>;

function blockedReasonFor(participant: Participant): string | null {
  if (participant.counterpart.isBanned) {
    return participant.isOwner
      ? "This tenant's account has been suspended."
      : "This owner's account has been suspended.";
  }
  return null;
}

export function toRoomMeta(participant: Participant): ChatRoomMeta {
  const { room, isOwner, counterpart } = participant;
  const blockedReason = blockedReasonFor(participant);
  return {
    id: room.id,
    role: isOwner ? "owner" : "tenant",
    counterpart: { id: counterpart.id, username: counterpart.username },
    pg: {
      id: room.pg.id,
      name: room.pg.name,
      city: room.pg.city,
      locality: room.pg.locality,
      rentPerMonth: room.pg.rentPerMonth,
      image: room.pg.images[0] ?? null,
      href: `/pg/${room.pg.id}`,
      isActive: room.pg.status === "ACTIVE",
    },
    canSend: blockedReason === null,
    blockedReason,
  };
}

/** Sends a message as `userId` after participant, ban and rate-limit checks. */
export async function sendChatMessage(chatId: string, userId: string, rawText: string) {
  const participant = await getChatForParticipant(chatId, userId);
  const blocked = blockedReasonFor(participant);
  if (blocked) throw forbidden(`${blocked} You can no longer send messages here.`);
  const text = sanitizeMessageText(rawText);
  enforceRateLimit(`chat:msg:${userId}`, MESSAGE_RATE_LIMIT.limit, MESSAGE_RATE_LIMIT.windowMs);
  return createMessage(chatId, userId, participant.counterpart.id, text);
}

/* ------------------------------------------------------------------ */
/* Inbox                                                               */
/* ------------------------------------------------------------------ */

function participantWhere(userId: string): Prisma.ChatRoomWhereInput {
  return {
    OR: [
      { userId },
      // Owners only see a conversation once the tenant has actually written.
      { pg: { ownerId: userId }, messages: { some: {} } },
    ],
  };
}

export async function listInbox(
  userId: string,
  { cursor, limit, q }: z.infer<typeof inboxQuerySchema>
): Promise<ChatInboxPage> {
  const where: Prisma.ChatRoomWhereInput = q
    ? {
        AND: [
          participantWhere(userId),
          {
            OR: [
              { pg: { name: { contains: q, mode: "insensitive" } } },
              { pg: { locality: { contains: q, mode: "insensitive" } } },
              { user: { username: { contains: q, mode: "insensitive" } } },
              { pg: { owner: { username: { contains: q, mode: "insensitive" } } } },
            ],
          },
        ],
      }
    : participantWhere(userId);

  const rows = await prisma.chatRoom.findMany({
    where,
    orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      userId: true,
      lastMessageAt: true,
      user: { select: { id: true, username: true } },
      pg: {
        select: {
          id: true,
          name: true,
          city: true,
          locality: true,
          images: true,
          ownerId: true,
          owner: { select: { id: true, username: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { text: true, senderId: true, createdAt: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const unreadRows = page.length
    ? await prisma.message.groupBy({
        by: ["chatRoomId"],
        where: {
          chatRoomId: { in: page.map((r) => r.id) },
          status: "SENT",
          senderId: { not: userId },
        },
        _count: { _all: true },
      })
    : [];
  const unread = new Map(unreadRows.map((r) => [r.chatRoomId, r._count._all]));

  const items: ChatInboxItem[] = page.map((row) => {
    const isOwner = row.pg.ownerId === userId;
    const counterpart = isOwner ? row.user : row.pg.owner;
    const last = row.messages[0];
    return {
      id: row.id,
      role: isOwner ? "owner" : "tenant",
      counterpart: { id: counterpart.id, username: counterpart.username },
      pg: {
        id: row.pg.id,
        name: row.pg.name,
        city: row.pg.city,
        locality: row.pg.locality,
        image: row.pg.images[0] ?? null,
      },
      lastMessage: last
        ? { text: last.text, senderId: last.senderId, createdAt: last.createdAt.toISOString() }
        : null,
      unread: unread.get(row.id) ?? 0,
      lastMessageAt: row.lastMessageAt.toISOString(),
    };
  });

  return { items, nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null };
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

const messageSelect = {
  id: true,
  chatRoomId: true,
  text: true,
  senderId: true,
  createdAt: true,
  status: true,
} as const;

/**
 * Returns up to `limit` messages older than `before` (an ISO date or a message
 * id from the same room), in ascending order.
 */
export async function listMessages(
  chatId: string,
  { before, limit }: z.infer<typeof messagesQuerySchema>
): Promise<ChatMessagesPage> {
  let olderThan: Prisma.MessageWhereInput | undefined;
  if (before) {
    const asDate = /^\d{4}-\d{2}-\d{2}T/.test(before) ? new Date(before) : null;
    if (asDate && !Number.isNaN(asDate.getTime())) {
      olderThan = { createdAt: { lt: asDate } };
    } else {
      const anchor = await prisma.message.findFirst({
        where: { id: before, chatRoomId: chatId },
        select: { id: true, createdAt: true },
      });
      if (!anchor) throw badRequest("before: unknown message");
      olderThan = {
        OR: [
          { createdAt: { lt: anchor.createdAt } },
          { createdAt: anchor.createdAt, id: { lt: anchor.id } },
        ],
      };
    }
  }

  const rows = await prisma.message.findMany({
    where: { chatRoomId: chatId, ...olderThan },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: messageSelect,
  });

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).reverse().map(
    (m): ChatMessage => ({
      id: m.id,
      chatId: m.chatRoomId,
      text: m.text,
      senderId: m.senderId,
      createdAt: m.createdAt.toISOString(),
      status: m.status,
    })
  );
  return { items, hasMore };
}

/**
 * Marks every message the counterpart sent in this room as READ and notifies
 * both participants (read ticks + unread badges) when anything changed.
 */
export async function markChatRead(chatId: string, readerId: string, counterpartId: string) {
  const { count } = await prisma.message.updateMany({
    where: { chatRoomId: chatId, senderId: { not: readerId }, status: "SENT" },
    data: { status: "READ" },
  });
  if (count > 0) {
    await emitRealtime(
      "message:read",
      [`chat:${chatId}`, `user:${counterpartId}`, `user:${readerId}`],
      { chatId, readerId }
    );
  }
  return count;
}
