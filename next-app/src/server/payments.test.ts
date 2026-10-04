import { afterEach, describe, expect, it, vi } from "vitest";

// env.ts reads process.env when first imported, so stub before a fresh import.
async function loadPayments(envs: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(envs)) vi.stubEnv(key, value);
  return import("./payments");
}

const KEY_SECRET = "rzp_test_secret";
const WEBHOOK_SECRET = "whsec_test";
// Precomputed: HMAC-SHA256(KEY_SECRET, "pay_29QQoUBi66xm2f|sub_00000000000001")
const CHECKOUT_SIG = "2764ca6c5092aa89ea1d57749a947d38cbdba0acd4c84a8079c505eb5f36a302";
const WEBHOOK_BODY = '{"event":"subscription.charged","payload":{}}';
// Precomputed: HMAC-SHA256(WEBHOOK_SECRET, WEBHOOK_BODY)
const WEBHOOK_SIG = "6173ab8f73f0a7d76dfae673c12ab42fbb92364bfed3b7efca0b6ede927a1ebc";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verifyCheckoutSignature", () => {
  it("accepts the Razorpay subscription checkout signature", async () => {
    const { verifyCheckoutSignature } = await loadPayments({ RAZORPAY_KEY_SECRET: KEY_SECRET });
    expect(verifyCheckoutSignature("pay_29QQoUBi66xm2f", "sub_00000000000001", CHECKOUT_SIG)).toBe(true);
  });

  it("rejects wrong ids, wrong signatures and swapped order", async () => {
    const { verifyCheckoutSignature } = await loadPayments({ RAZORPAY_KEY_SECRET: KEY_SECRET });
    expect(verifyCheckoutSignature("pay_other", "sub_00000000000001", CHECKOUT_SIG)).toBe(false);
    expect(verifyCheckoutSignature("pay_29QQoUBi66xm2f", "sub_00000000000001", "deadbeef")).toBe(false);
    expect(verifyCheckoutSignature("sub_00000000000001", "pay_29QQoUBi66xm2f", CHECKOUT_SIG)).toBe(false);
  });

  it("fails closed without a key secret", async () => {
    const { verifyCheckoutSignature } = await loadPayments({ RAZORPAY_KEY_SECRET: "" });
    expect(verifyCheckoutSignature("pay_29QQoUBi66xm2f", "sub_00000000000001", CHECKOUT_SIG)).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature over the raw body", async () => {
    const { verifyWebhookSignature } = await loadPayments({ RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET });
    expect(verifyWebhookSignature(WEBHOOK_BODY, WEBHOOK_SIG)).toBe(true);
  });

  it("rejects re-serialised bodies, missing and wrong signatures", async () => {
    const { verifyWebhookSignature } = await loadPayments({ RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET });
    expect(verifyWebhookSignature(JSON.stringify(JSON.parse(WEBHOOK_BODY), null, 2), WEBHOOK_SIG)).toBe(false);
    expect(verifyWebhookSignature(WEBHOOK_BODY, null)).toBe(false);
    expect(verifyWebhookSignature(WEBHOOK_BODY, WEBHOOK_SIG.replace(/.$/, "0"))).toBe(false);
  });

  it("fails closed without a webhook secret", async () => {
    const { verifyWebhookSignature } = await loadPayments({ RAZORPAY_WEBHOOK_SECRET: "" });
    expect(verifyWebhookSignature(WEBHOOK_BODY, WEBHOOK_SIG)).toBe(false);
  });
});
