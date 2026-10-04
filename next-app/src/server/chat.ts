import "server-only";
import prisma from "@/lib/prisma";
import { env } from "./env";
import { notFound } from "./http";

export type ChatMessage = {
  id: string;
  chatId: string;
  text: string;
  senderId: string;
  createdAt: string;
  status: "SENT" | "READ";
};

/** Loads a chat room only if `userId` is one of its two participants. */
export async function getChatForParticipant(chatId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: chatId },
    select: {
      id: true,
      userId: true,
      pgId: true,
      user: { select: { id: true, username: true } },
      pg: {
        select: {
          id: true,
          name: true,
          city: true,
          locality: true,
          rentPerMonth: true,
          images: true,
          ownerId: true,
          owner: { select: { id: true, username: true } },
        },
      },
    },
  });
  if (!room || (room.userId !== userId && room.pg.ownerId !== userId)) {
    throw notFound("Conversation not found");
  }
  const isOwner = room.pg.ownerId === userId;
  return {
    room,
    isOwner,
    counterpart: isOwner ? room.user : room.pg.owner,
  };
}

/**
 * Pushes an event to the realtime server. Fire-and-forget: chat keeps working
 * (via polling) even if the socket server is down or not deployed.
 */
export async function emitRealtime(event: string, rooms: string[], payload: unknown) {
  if (!env.socket.internalUrl || !env.socket.internalSecret) return;
  try {
    await fetch(`${env.socket.internalUrl.replace(/\/$/, "")}/internal/emit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": env.socket.internalSecret,
      },
      body: JSON.stringify({ event, rooms, payload }),
      signal: AbortSignal.timeout(1500),
    });
  } catch (error) {
    console.warn("[realtime] emit failed", (error as Error).message);
  }
}

export async function createMessage(chatId: string, senderId: string, recipientId: string, text: string) {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { chatRoomId: chatId, senderId, text },
      select: { id: true, text: true, senderId: true, createdAt: true, status: true },
    }),
    prisma.chatRoom.update({ where: { id: chatId }, data: { lastMessageAt: new Date() } }),
  ]);

  const payload: ChatMessage = {
    id: message.id,
    chatId,
    text: message.text,
    senderId: message.senderId,
    createdAt: message.createdAt.toISOString(),
    status: message.status,
  };
  await emitRealtime("message:new", [`chat:${chatId}`, `user:${recipientId}`], payload);
  return payload;
}

export async function unreadCountFor(userId: string) {
  return prisma.message.count({
    where: {
      status: "SENT",
      senderId: { not: userId },
      chatRoom: { OR: [{ userId }, { pg: { ownerId: userId } }] },
    },
  });
}
