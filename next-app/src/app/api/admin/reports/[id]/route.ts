import { requireUser } from "@/server/auth/guard";
import { decideReport, parseId, reportDecisionSchema } from "@/server/admin";
import { ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireUser(req, { admin: true });
  enforceRateLimit(`admin:report:${admin.id}`, 120, 60_000);
  const id = parseId((await params).id, "Report");
  const input = reportDecisionSchema.parse(await readJson(req));
  return ok(await decideReport(id, input));
});
