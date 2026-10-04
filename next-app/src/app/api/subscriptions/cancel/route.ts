import { requireUser } from "@/server/auth/guard";
import { cancelSubscriptionFor, cancelSubscriptionSchema } from "@/server/billing";
import { ok, readJson, route } from "@/server/http";

/** Cancels the user's subscription immediately and moves them to the free plan. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { subscriptionId } = cancelSubscriptionSchema.parse(await readJson(req));
  return ok(await cancelSubscriptionFor(user, subscriptionId));
});
