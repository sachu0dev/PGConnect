import { requireUser } from "@/server/auth/guard";
import { getChatForParticipant } from "@/server/chat";
import { idParamSchema, markChatRead } from "@/server/chat-queries";
import { ok, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const chatId = idParamSchema.parse((await params).id);
  const { counterpart } = await getChatForParticipant(chatId, user.id);
  const updated = await markChatRead(chatId, user.id, counterpart.id);
  return ok({ updated });
});
