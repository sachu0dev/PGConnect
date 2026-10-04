import "server-only";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { PLANS, PLAN_RANK, type PlanId } from "@/lib/constants";
import type { AuthUser } from "./auth/guard";
import { env, features } from "./env";
import { ApiError, badRequest, conflict, notFound } from "./http";
import { planIdFor, razorpay, verifyCheckoutSignature } from "./payments";
import { enforceRateLimit } from "./rate-limit";

/** Subscription.status values we store (Razorpay statuses, upper-cased). */
export type SubscriptionStatus = "PENDING" | "ACTIVE" | "HALTED" | "CANCELLED" | "COMPLETED" | "EXPIRED";

export type SubscriptionInfo = {
  id: string;
  razorpaySubscriptionId: string;
  plan: "BASIC" | "PREMIUM";
  planName: string;
  status: SubscriptionStatus;
  /** Monthly price in rupees (not paise). */
  amount: number;
  startDate: string | null;
  endDate: string | null;
  lastPaymentDate: string | null;
  createdAt: string;
};

export type CheckoutSession = {
  subscriptionId: string;
  keyId: string;
  plan: "BASIC" | "PREMIUM";
  planName: string;
  /** Monthly price in rupees (Razorpay charges the plan amount configured on its side). */
  amount: number;
  prefill: { name: string; email: string; contact: string | null };
};

const PENDING_REUSE_MS = 30 * 60 * 1000;

export const paidPlanSchema = z.enum(["BASIC", "PREMIUM"]);
export const createSubscriptionSchema = z.object({ plan: paidPlanSchema });
export const verifySubscriptionSchema = z.object({
  razorpay_payment_id: z.string().trim().min(1).max(100),
  razorpay_subscription_id: z.string().trim().min(1).max(100),
  razorpay_signature: z.string().trim().min(1).max(256),
});
export const cancelSubscriptionSchema = z.object({ subscriptionId: z.string().trim().min(1).max(100) });

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toInfo(row: {
  id: string;
  razorpaySubscriptionId: string;
  plan: string;
  status: string;
  amount: number;
  startDate: Date | null;
  endDate: Date | null;
  lastPaymentDate: Date | null;
  createdAt: Date;
}): SubscriptionInfo {
  const plan = row.plan === "PREMIUM" ? "PREMIUM" : "BASIC";
  return {
    id: row.id,
    razorpaySubscriptionId: row.razorpaySubscriptionId,
    plan,
    planName: PLANS[plan].name,
    status: row.status as SubscriptionStatus,
    amount: row.amount,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    lastPaymentDate: row.lastPaymentDate?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Pauses ACTIVE listings beyond the plan's limit, keeping the newest ones live.
 * Returns how many listings were paused.
 */
export async function pauseExcessListings(userId: string, plan: PlanId): Promise<number> {
  const limit = PLANS[plan].listingLimit;
  const active = await prisma.pg.findMany({
    where: { ownerId: userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const excess = active.slice(limit).map((p) => p.id);
  if (excess.length === 0) return 0;
  const result = await prisma.pg.updateMany({
    where: { id: { in: excess }, status: "ACTIVE" },
    data: { status: "PAUSED" },
  });
  return result.count;
}

/**
 * Recomputes a user's membership from their ACTIVE subscriptions and pauses
 * listings beyond the resulting plan limit. Returns the membership and how
 * many listings were paused.
 */
export async function syncMembership(userId: string): Promise<{ membership: PlanId; pausedListings: number }> {
  const active = await prisma.subscription.findMany({
    where: { userId, status: "ACTIVE" },
    select: { plan: true },
  });
  const membership = active
    .map((s) => (s.plan === "PREMIUM" || s.plan === "BASIC" ? (s.plan as PlanId) : "FREE"))
    .reduce<PlanId>((best, plan) => (PLAN_RANK[plan] > PLAN_RANK[best] ? plan : best), "FREE");
  await prisma.user.update({ where: { id: userId }, data: { membership } });
  const pausedListings = await pauseExcessListings(userId, membership);
  return { membership, pausedListings };
}

/* -------------------------------------------------------------------------- */
/*                                   Create                                   */
/* -------------------------------------------------------------------------- */

export async function createCheckout(user: AuthUser, plan: "BASIC" | "PREMIUM"): Promise<CheckoutSession> {
  const planId = planIdFor(plan);
  if (!features.payments || !planId || !env.razorpay.keyId) {
    throw new ApiError(503, "Online payments are coming soon. Please contact support to upgrade your plan.");
  }

  const active = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    select: { plan: true },
  });
  if (active) {
    const name = PLANS[active.plan === "PREMIUM" ? "PREMIUM" : "BASIC"].name;
    throw conflict(
      `You already have an active ${name} plan. To switch plans, cancel it first — the new plan starts as soon as you subscribe again.`
    );
  }

  const prefill = { name: user.username, email: user.email, contact: user.phoneNumber };
  const base = { keyId: env.razorpay.keyId, plan, planName: PLANS[plan].name, amount: PLANS[plan].priceMonthly, prefill };

  const reusable = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      plan,
      status: "PENDING",
      createdAt: { gte: new Date(Date.now() - PENDING_REUSE_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { razorpaySubscriptionId: true },
  });
  if (reusable) return { ...base, subscriptionId: reusable.razorpaySubscriptionId };

  enforceRateLimit(`subscription-create:${user.id}`, 10, 60 * 60 * 1000);

  let remoteId: string;
  try {
    const remote = await razorpay().subscriptions.create({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
      notes: { userId: user.id, plan },
    });
    remoteId = remote.id;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("[billing] razorpay subscription create failed", error);
    throw new ApiError(502, "We couldn't start the payment right now. Please try again in a moment.");
  }

  await prisma.subscription.create({
    data: {
      userId: user.id,
      razorpaySubscriptionId: remoteId,
      plan,
      status: "PENDING",
      // Stored in rupees. Razorpay works in paise; we never send this amount to it.
      amount: PLANS[plan].priceMonthly,
    },
  });

  return { ...base, subscriptionId: remoteId };
}

/* -------------------------------------------------------------------------- */
/*                                   Verify                                   */
/* -------------------------------------------------------------------------- */

export async function verifyCheckout(user: AuthUser, input: z.infer<typeof verifySubscriptionSchema>) {
  const sub = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: input.razorpay_subscription_id },
  });
  if (!sub || sub.userId !== user.id) throw notFound("Subscription not found");

  if (!verifyCheckoutSignature(input.razorpay_payment_id, input.razorpay_subscription_id, input.razorpay_signature)) {
    throw badRequest("We couldn't verify this payment. If money was debited, contact support with your payment ID.");
  }

  // Idempotent: the same payment confirmed twice (or after the webhook) is a no-op.
  if (sub.status === "ACTIVE") {
    return { subscription: toInfo(sub), membership: (await syncMembership(user.id)).membership };
  }
  if (sub.status !== "PENDING") {
    throw conflict("This subscription is no longer active. Please start a new subscription.");
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "ACTIVE",
      startDate: sub.startDate ?? now,
      lastPaymentId: input.razorpay_payment_id,
      lastPaymentDate: now,
      endDate: addMonths(now, 1),
    },
  });
  const { membership } = await syncMembership(user.id);
  return { subscription: toInfo(updated), membership };
}

/* -------------------------------------------------------------------------- */
/*                                   Current                                  */
/* -------------------------------------------------------------------------- */

export async function currentSubscription(user: AuthUser) {
  const active = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  const pending = active
    ? null
    : await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: "PENDING",
          createdAt: { gte: new Date(Date.now() - PENDING_REUSE_MS) },
        },
        orderBy: { createdAt: "desc" },
      });
  const row = active ?? pending;
  return {
    subscription: row ? toInfo(row) : null,
    membership: user.membership,
    paymentsEnabled: features.payments,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Cancel                                   */
/* -------------------------------------------------------------------------- */

const TERMINAL_REMOTE = new Set(["cancelled", "completed", "expired"]);

export async function cancelSubscriptionFor(user: AuthUser, subscriptionId: string) {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      OR: [{ id: subscriptionId }, { razorpaySubscriptionId: subscriptionId }],
    },
  });
  if (!sub) throw notFound("Subscription not found");
  if (sub.status !== "ACTIVE" && sub.status !== "PENDING") {
    throw conflict("This subscription is already inactive.");
  }

  enforceRateLimit(`subscription-cancel:${user.id}`, 10, 60 * 60 * 1000);

  if (features.payments) {
    try {
      await razorpay().subscriptions.cancel(sub.razorpaySubscriptionId, false);
    } catch (error) {
      // Already cancelled/finished on Razorpay's side is fine; anything else is not.
      let remoteStatus: string | null = null;
      try {
        remoteStatus = (await razorpay().subscriptions.fetch(sub.razorpaySubscriptionId)).status;
      } catch {
        remoteStatus = null;
      }
      const neverStarted = sub.status === "PENDING" && (remoteStatus === "created" || remoteStatus === null);
      if (!(remoteStatus && TERMINAL_REMOTE.has(remoteStatus)) && !neverStarted) {
        console.error("[billing] razorpay cancel failed", error);
        throw new ApiError(502, "We couldn't cancel the subscription right now. Please try again or contact support.");
      }
    }
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", cancellationDate: new Date() },
  });
  const { membership, pausedListings } = await syncMembership(user.id);
  return { membership, pausedListings };
}

/* -------------------------------------------------------------------------- */
/*                                  Webhooks                                  */
/* -------------------------------------------------------------------------- */

const webhookSchema = z.object({
  event: z.string(),
  payload: z
    .object({
      subscription: z
        .object({
          entity: z
            .object({
              id: z.string(),
              status: z.string().optional(),
              current_start: z.number().nullable().optional(),
              current_end: z.number().nullable().optional(),
            })
            .passthrough(),
        })
        .optional(),
      payment: z
        .object({
          entity: z.object({ id: z.string(), created_at: z.number().optional() }).passthrough(),
        })
        .optional(),
    })
    .passthrough()
    .default({}),
});

const ENDING_EVENTS: Record<string, SubscriptionStatus> = {
  "subscription.halted": "HALTED",
  "subscription.cancelled": "CANCELLED",
  "subscription.completed": "COMPLETED",
  "subscription.expired": "EXPIRED",
};

/** Applies a verified Razorpay webhook. Unknown events are acknowledged and ignored. */
export async function handleRazorpayEvent(raw: unknown): Promise<{ handled: boolean }> {
  const parsed = webhookSchema.safeParse(raw);
  if (!parsed.success) return { handled: false };
  const { event, payload } = parsed.data;
  const entity = payload.subscription?.entity;
  if (!entity) return { handled: false };

  const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: entity.id } });
  if (!sub) return { handled: false };

  if (event === "subscription.activated" || event === "subscription.charged") {
    // Never resurrect a subscription the user already cancelled or that ended.
    if (sub.status !== "ACTIVE" && sub.status !== "PENDING") return { handled: false };

    const payment = payload.payment?.entity;
    if (event === "subscription.charged" && payment && sub.lastPaymentId === payment.id && sub.status === "ACTIVE") {
      return { handled: true }; // duplicate delivery
    }

    const now = new Date();
    const endDate = entity.current_end ? new Date(entity.current_end * 1000) : addMonths(now, 1);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        startDate: sub.startDate ?? (entity.current_start ? new Date(entity.current_start * 1000) : now),
        endDate: sub.endDate && sub.endDate > endDate ? sub.endDate : endDate,
        ...(payment
          ? {
              lastPaymentId: payment.id,
              lastPaymentDate: payment.created_at ? new Date(payment.created_at * 1000) : now,
            }
          : {}),
      },
    });
    await syncMembership(sub.userId);
    return { handled: true };
  }

  const ending = ENDING_EVENTS[event];
  if (ending) {
    if (sub.status !== ending) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: ending,
          ...(ending === "CANCELLED" && !sub.cancellationDate ? { cancellationDate: new Date() } : {}),
        },
      });
    }
    await syncMembership(sub.userId);
    return { handled: true };
  }

  return { handled: false };
}
