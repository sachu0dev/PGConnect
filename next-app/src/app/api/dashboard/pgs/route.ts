import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Authenticate the incoming request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return early if authentication fails
    }
    const userId = authResult;

    // Fetch the PG data for the authenticated user
    const userPgs = await prisma.pg.findMany({
      where: {
        owner: {
          id: userId,
        },
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        coordinates: true,
        rentPerMonth: true,
        isDummy: true,
        bhk: true,
        gender: true,
        capacityCount: true,
        createdAt: true,
        capacity: true,
        images: true,
        description: true,
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        ChatRoom: {
          select: {
            id: true,
            messages: {
              where: {
                senderId: { not: userId },
                status: "SENT",
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const userPgsWithActivity = userPgs.map((pg) => {
      const newActivity = pg.ChatRoom.some(
        (chatRoom) => chatRoom.messages.length > 0
      );
      return {
        ...pg,
        newActivity,
      };
    });

    // Return the fetched data with the new field
    return NextResponse.json({
      success: true,
      data: userPgsWithActivity,
    });
  } catch (error) {
    console.error("PG Search Error:", error); // Log the error for debugging
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
