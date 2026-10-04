import { handleRazorpayEvent } from "@/server/billing";
import { fail, ok, route } from "@/server/http";
import { verifyWebhookSignature } from "@/server/payments";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhooks. The signature is computed over the raw body, so read it as
 * text before parsing. Refunds are never issued automatically from here.
 */
export const POST = route(async (req) => {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return fail(400, "Invalid signature");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return fail(400, "Malformed payload");
  }
  const result = await handleRazorpayEvent(payload);
  return ok({ received: true, handled: result.handled });
});
