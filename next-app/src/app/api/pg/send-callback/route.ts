import { authenticateRequest } from "@/helpers/AuthenticateUser";
import { sendCallbackRequest } from "@/helpers/sendCallbackRequest";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const userId = authResult;

    const body = await req.json();
    const { PhoneNumber, pgId } = body;

    if (!PhoneNumber || !pgId) {
      return NextResponse.json(
        { error: "PhoneNumber and pgId are required", success: false },
        { status: 400 }
      );
    }

    const pgOwnerDetails = await prisma.pg.findUnique({
      where: { id: pgId },
      select: {
        name: true,
        owner: {
          select: { email: true },
        },
      },
    });

    if (!pgOwnerDetails) {
      return NextResponse.json(
        { error: "PG not found", success: false },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", success: false },
        { status: 404 }
      );
    }

    const existingCallbackRequest = await prisma.callbackRequest.findFirst({
      where: {
        pgId: pgId,
        userId: userId,
      },
    });

    if (existingCallbackRequest) {
      return NextResponse.json(
        { error: "Callback request already sent", success: false },
        { status: 400 }
      );
    }

    await prisma.callbackRequest.create({
      data: {
        phoneNumber: PhoneNumber,
        pgId: pgId,
        userId: userId,
      },
    });

    const emailResponse = await sendCallbackRequest({
      PhoneNumber,
      pgName: pgOwnerDetails.name,
      username: user.username,
      email: pgOwnerDetails.owner.email,
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Callback request sent successfully, cannot be sent again",
        emailResponse,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error processing callback request:", error);

    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
