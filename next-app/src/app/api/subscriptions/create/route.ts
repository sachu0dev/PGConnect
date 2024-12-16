import { razorpay } from "@/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";

enum VALID_PLANS {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
  BASIC = "BASIC",
}
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        membership: true,
        Subscription: {
          select: {
            status: true,
          },
          take: 1,
        },
      },
    });

    if (user?.Subscription?.[0]?.status === "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "You are already subscribed to a membership. Please cancel your current subscription",
          success: false,
        },
        { status: 200 }
      );
    }

    const { planTag } = (await req.json()) as { planTag?: VALID_PLANS };

    if (!planTag || !Object.values(VALID_PLANS).includes(planTag)) {
      return NextResponse.json(
        { error: "Invalid plan tag", success: false },
        { status: 400 }
      );
    }

    let planId = undefined;

    if (planTag == VALID_PLANS.PREMIUM) {
      planId = process.env.RAZORPAY_PREMIUM_PLAN_ID;
    }

    if (planTag == VALID_PLANS.BASIC) {
      planId = process.env.RAZORPAY_BASIC_PLAN_ID;
    }

    if (planTag == VALID_PLANS.FREE) {
      planId = process.env.RAZORPAY_FREE_PLAN_ID;
    }

    console.log("Plan ID:", planId);

    if (!planId) {
      return NextResponse.json(
        { error: "Invalid plan tag", success: false },
        { status: 400 }
      );
    }

    console.log("data:", planId);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      notes: {
        userId: userId,
        planType: planTag,
      },
    });

    console.log("subscription", subscription);

    console.log("Subscription created:", subscription);

    console.log("Subscription ID:", {
      userId: userId,
      razorpaySubscriptionId: subscription.id,
      status: "PENDING",
      plan: planTag,
      amount: planTag === "PREMIUM" ? 4999 : 499,
    });

    await prisma.subscription.create({
      data: {
        userId: userId,
        razorpaySubscriptionId: subscription.id,
        status: "PENDING",
        retryLink: subscription.short_url,
        plan: planTag,
        amount: planTag === "PREMIUM" ? 4999 : 499,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.log("Subscription creation error:", error);
    return NextResponse.json(
      {
        error: "Subscription creation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
