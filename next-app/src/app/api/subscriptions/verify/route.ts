import prisma from "@/lib/prisma";
import { Membership } from "@prisma/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    console.log("Received Payment ID:", razorpay_payment_id);
    console.log("Received Subscription ID:", razorpay_subscription_id);
    console.log("Received Signature:", razorpay_signature);
    console.log("Generated Signature:", generated_signature);

    console.log("Signature Match:", generated_signature === razorpay_signature);

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        {
          redirect: `${process.env.NEXT_PUBLIC_API_URL}/payment/failure`,
          success: false,
        },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: razorpay_subscription_id },
    });

    console.log("subscription", subscription);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: subscription.userId },
        data: {
          membership: subscription.plan as Membership,
        },
      }),
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          startDate: new Date(),
          lastPaymentDate: new Date(),
        },
      }),
    ]);

    console.log("Subscription verified and activated");

    return NextResponse.json({
      message: "Subscription verified and activated",
    });
  } catch (error) {
    console.log("Subscription verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
