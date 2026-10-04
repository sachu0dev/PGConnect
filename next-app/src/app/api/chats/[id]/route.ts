import { requireUser } from "@/server/auth/guard";
import { getChatForParticipant } from "@/server/chat";
import { idParamSchema, toRoomMeta } from "@/server/chat-queries";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Conversation header data (participants only; others get 404). */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const chatId = idParamSchema.parse((await params).id);
  const participant = await getChatForParticipant(chatId, user.id);
  return ok(toRoomMeta(participant), { headers: { "cache-control": "no-store" } });
});
