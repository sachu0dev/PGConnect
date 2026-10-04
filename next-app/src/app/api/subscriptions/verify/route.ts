import { requireUser } from "@/server/auth/guard";
import { verifyCheckout, verifySubscriptionSchema } from "@/server/billing";
import { ok, readJson, route } from "@/server/http";

/** Confirms a completed checkout (signature-verified, idempotent). */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const body = verifySubscriptionSchema.parse(await readJson(req));
  return ok(await verifyCheckout(user, body));
});
