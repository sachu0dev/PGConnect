import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { startChat } from "@/server/chat-queries";
import { ok, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * @deprecated Use POST /api/pg/[id]/chat. Kept for old clients: any
 * client-supplied `chatId` is ignored; the room is always resolved from the
 * signed-in user + PG so nobody can post into someone else's conversation.
 */
const legacySendSchema = z.object({
  pgId: z.string().trim().min(1, "pgId is required").max(64),
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { pgId, message } = legacySendSchema.parse(await readJson(req));
  const { chatId, created } = await startChat(user.id, pgId, message);
  return ok({ chatId }, created ? 201 : 200);
});
