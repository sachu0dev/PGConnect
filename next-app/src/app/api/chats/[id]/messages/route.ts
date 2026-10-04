import { requireUser } from "@/server/auth/guard";
import { getChatForParticipant } from "@/server/chat";
import {
  idParamSchema,
  listMessages,
  markChatRead,
  messagesQuerySchema,
  sendChatMessage,
} from "@/server/chat-queries";
import { ok, readJson, route } from "@/server/http";
import { messageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Message history (ascending). Opening the latest page also marks the
 * counterpart's messages as read.
 */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const chatId = idParamSchema.parse((await params).id);
  const query = messagesQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { counterpart } = await getChatForParticipant(chatId, user.id);

  if (!query.before) await markChatRead(chatId, user.id, counterpart.id);
  const page = await listMessages(chatId, query);
  return ok(page, { headers: { "cache-control": "no-store" } });
});

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const chatId = idParamSchema.parse((await params).id);
  const { text } = messageSchema.parse(await readJson(req));
  const message = await sendChatMessage(chatId, user.id, text);
  return ok(message, 201);
});
