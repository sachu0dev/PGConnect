import { route, ok, readJson } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import { submitLead } from "@/server/leads";
import { leadSchema } from "@/lib/validation";

/** Tenant requests a callback or schedules a visit. Emails the owner. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  const input = leadSchema.parse(await readJson(req));
  return ok(await submitLead(user, id, input), 201);
});
