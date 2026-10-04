import "server-only";
import crypto from "crypto";
import Razorpay from "razorpay";
import { env, features } from "./env";
import { ApiError } from "./http";
import { safeEqual } from "./auth/tokens";

let instance: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!features.payments) throw new ApiError(503, "Payments are not available right now");
  instance ??= new Razorpay({ key_id: env.razorpay.keyId!, key_secret: env.razorpay.keySecret! });
  return instance;
}

export function planIdFor(plan: "BASIC" | "PREMIUM") {
  return plan === "BASIC" ? env.razorpay.basicPlanId : env.razorpay.premiumPlanId;
}

export function verifyCheckoutSignature(paymentId: string, subscriptionId: string, signature: string) {
  if (!env.razorpay.keySecret) return false;
  const expected = crypto
    .createHmac("sha256", env.razorpay.keySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signatures must be computed on the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!env.razorpay.webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", env.razorpay.webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
