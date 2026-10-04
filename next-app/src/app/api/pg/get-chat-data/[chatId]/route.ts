import { requireUser } from "@/server/auth/guard";
import { getChatForParticipant } from "@/server/chat";
import { idParamSchema, listMessages, markChatRead, toRoomMeta } from "@/server/chat-queries";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** @deprecated Use GET /api/chats/[id] and GET /api/chats/[id]/messages. */
export const GET = route<{ chatId: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const chatId = idParamSchema.parse((await params).chatId);
  const participant = await getChatForParticipant(chatId, user.id);
  await markChatRead(chatId, user.id, participant.counterpart.id);
  const { items, hasMore } = await listMessages(chatId, { limit: 50 });
  return ok(
    { chat: toRoomMeta(participant), messages: items, hasMore },
    { headers: { "cache-control": "no-store" } }
  );
});
