import { requireUser } from "@/server/auth/guard";
import { createCheckout, createSubscriptionSchema } from "@/server/billing";
import { ok, readJson, route } from "@/server/http";

/** Starts a Razorpay subscription checkout for a paid plan. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { plan } = createSubscriptionSchema.parse(await readJson(req));
  return ok(await createCheckout(user, plan));
});
