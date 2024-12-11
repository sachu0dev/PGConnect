import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const userId = authResult;

  try {
    const pg = await prisma.pg.findUnique({
      where: {
        id: id,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        city: true,
        contact: true,
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
            phoneNumber: true,
          },
        },
      },
    });

    const rawChatRooms = await prisma.chatRoom.findMany({
      where: {
        pgId: id,
      },
      select: {
        id: true,
        pgId: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const chatRooms = await Promise.all(
      rawChatRooms.map(async (room) => ({
        ...room,
        messageCount: await prisma.message.count({
          where: {
            senderId: { not: userId },
            chatRoomId: room.id,
            status: "SENT",
          },
        }),
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        pg,
        chatRooms,
      },
    });
  } catch (error) {
    console.log("PG Search Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
