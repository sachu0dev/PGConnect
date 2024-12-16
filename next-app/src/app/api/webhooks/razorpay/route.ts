import prisma from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Membership } from "@prisma/client";

export async function POST(req: NextRequest) {
  console.log("Webhook received");

  try {
    const payload = await req.json();
    const razorpay_signature = req.headers.get("x-razorpay-signature");

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = payload.event;
    const subscriptionId = payload.payload.subscription.entity.id;
    const paymentId = payload.payload.payment?.entity?.id;

    switch (event) {
      case "subscription.charged":
        await handleSubscriptionCharged(subscriptionId, paymentId);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(subscriptionId);
        break;

      case "subscription.completed":
        await handleSubscriptionCompleted(subscriptionId);
        break;

      case "subscription.halted":
        await handleSubscriptionHalted(subscriptionId);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.log("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCharged(
  subscriptionId: string,
  paymentId?: string
) {
  console.log("handleSubscriptionCharged", subscriptionId, paymentId);

  try {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionId },
      include: { user: true },
    });

    if (!existingSubscription) {
      console.log(`Subscription not found: ${subscriptionId}`);
      return;
    }

    const membershipMap: Record<string, Membership> = {
      BASIC: "BASIC",
      PREMIUM: "PREMIUM",
    };
    const newMembership = membershipMap[existingSubscription.plan] || "FREE";

    await prisma.subscription.update({
      where: { razorpaySubscriptionId: subscriptionId },
      data: {
        lastPaymentDate: new Date(),
        lastPaymentId: paymentId,
        status: "ACTIVE",
        startDate: existingSubscription.startDate || new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
    });

    if (existingSubscription.user.membership === "FREE") {
      await prisma.user.update({
        where: { id: existingSubscription.userId },
        data: { membership: newMembership },
      });
    }
  } catch (error) {
    console.log("Error in handleSubscriptionCharged:", error);
  }
}

async function handleSubscriptionCancelled(subscriptionId: string) {
  console.log("handleSubscriptionCancelled", subscriptionId);
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionId },
      include: { user: true },
    });

    if (!subscription) return;

    const subscriptionStartDate = subscription.startDate;
    const daysSinceStart = subscriptionStartDate
      ? (new Date().getTime() - subscriptionStartDate.getTime()) /
        (1000 * 3600 * 24)
      : 0;

    if (daysSinceStart <= 7 && subscription.lastPaymentId) {
      try {
        await razorpay.payments.refund(subscription.lastPaymentId, {
          amount: subscription.amount,
          notes: {
            reason: "Early cancellation",
            userId: subscription.userId,
          },
        });
      } catch (refundError) {
        console.log("Refund failed:", refundError);
      }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: subscription.userId },
        data: { membership: "FREE" },
      }),
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELLED",
          cancellationDate: new Date(),
          endDate: new Date(),
        },
      }),
    ]);
  } catch (error) {
    console.log("Error in handleSubscriptionCancelled:", error);
  }
}

async function handleSubscriptionCompleted(subscriptionId: string) {
  console.log("handleSubscriptionCompleted", subscriptionId);
  try {
    await prisma.subscription.update({
      where: { razorpaySubscriptionId: subscriptionId },
      data: {
        status: "COMPLETED",
        endDate: new Date(),
      },
    });

    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionId },
    });

    if (subscription) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { membership: "FREE" },
      });
    }
  } catch (error) {
    console.log("Error in handleSubscriptionCompleted:", error);
  }
}

async function handleSubscriptionHalted(subscriptionId: string) {
  console.log("handleSubscriptionHalted", subscriptionId);
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionId },
      include: { user: true },
    });

    if (!subscription) return;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: subscription.userId },
        data: { membership: "FREE" },
      }),
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "PAUSED",
          endDate: new Date(),
        },
      }),
    ]);
  } catch (error) {
    console.log("Error in handleSubscriptionHalted:", error);
  }
}
