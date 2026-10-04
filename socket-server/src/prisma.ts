import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({ log: [{ emit: "stdout", level: "error" }] });

/** True when `userId` is the tenant of the chat room or the owner of its PG. */
export async function isChatParticipant(chatId: string, userId: string): Promise<boolean> {
  const room = await prisma.chatRoom.findFirst({
    where: { id: chatId, OR: [{ userId }, { pg: { ownerId: userId } }] },
    select: { id: true },
  });
  return room !== null;
}

export async function loadActiveUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBanned: true },
  });
  return user && !user.isBanned ? { id: user.id } : null;
}
