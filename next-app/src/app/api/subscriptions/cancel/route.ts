import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { authenticateRequest } from "@/helpers/AuthenticateUser";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;

    const { subscriptionId } = await req.json();

    const subscription = await prisma.subscription.findUnique({
      where: {
        razorpaySubscriptionId: subscriptionId,
        userId: userId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found", success: false },
        { status: 404 }
      );
    }

    if (subscription.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Subscription is already cancelled", success: false },
        { status: 400 }
      );
    }

    try {
      await razorpay.subscriptions.cancel(subscriptionId);
    } catch (razorpayError) {
      console.error("Razorpay cancellation error:", razorpayError);
      return NextResponse.json(
        {
          error: "Failed to cancel subscription with payment provider",
          success: false,
        },
        { status: 500 }
      );
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELLED",
        cancellationDate: new Date(),
        endDate: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { membership: "FREE" },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription", success: false },
      { status: 500 }
    );
  }
}
