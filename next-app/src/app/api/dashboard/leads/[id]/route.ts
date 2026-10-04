import { leadStatusSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guard";
import { ok, readJson, route } from "@/server/http";
import { updateLeadStatus } from "@/server/owner";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req, { owner: true });
  const { id } = await params;
  const { status } = leadStatusSchema.parse(await readJson(req));
  return ok(await updateLeadStatus(user.id, id, status));
});
