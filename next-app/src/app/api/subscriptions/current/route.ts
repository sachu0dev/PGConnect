import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/helpers/AuthenticateUser";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: {
          in: ["ACTIVE", "PENDING", "PAUSED"],
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        message: "No active subscription found",
      });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        lastPaymentDate: subscription.lastPaymentDate,
        status: subscription.status,
        razorpaySubscriptionId: subscription.razorpaySubscriptionId,
        amount: subscription.amount,
      },
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}
