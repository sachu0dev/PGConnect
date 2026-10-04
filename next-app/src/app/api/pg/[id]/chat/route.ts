import { requireUser } from "@/server/auth/guard";
import { idParamSchema, startChat } from "@/server/chat-queries";
import { ok, readJson, route } from "@/server/http";
import { startChatSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Get-or-create the conversation with this PG's owner (optionally sending a first message). */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const pgId = idParamSchema.parse((await params).id);
  const body = startChatSchema.parse(await readJson(req));
  const { chatId, created } = await startChat(user.id, pgId, body.message);
  return ok({ chatId }, created ? 201 : 200);
});
