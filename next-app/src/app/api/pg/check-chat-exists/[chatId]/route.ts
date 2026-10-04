import prisma from "@/lib/prisma";
import { requireUser } from "@/server/auth/guard";
import { idParamSchema } from "@/server/chat-queries";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * @deprecated Use GET /api/chats/[id] (404 for non-participants).
 * Returns `exists: true` only when the room exists AND the caller takes part in it.
 */
export const GET = route<{ chatId: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const chatId = idParamSchema.parse((await params).chatId);
  const room = await prisma.chatRoom.findFirst({
    where: { id: chatId, OR: [{ userId: user.id }, { pg: { ownerId: user.id } }] },
    select: { id: true },
  });
  return ok({ exists: room !== null });
});
