import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  const { searchParams } = req.nextUrl;
  const { chatId } = await context.params;

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;

  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;

    if (!chatId) {
      return NextResponse.json(
        { error: "ChatId is required", success: false },
        { status: 400 }
      );
    }

    await prisma.message.updateMany({
      where: {
        chatRoomId: chatId,
        senderId: { not: userId },
        status: "SENT",
      },
      data: {
        status: "READ",
      },
    });

    const totalMessageCount = await prisma.message.count({
      where: { chatRoomId: chatId },
    });

    const ChatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        messages: {
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            text: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        pg: {
          select: {
            id: true,
            name: true,
            rentPerMonth: true,
            address: true,
            owner: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!ChatRoom) {
      return NextResponse.json(
        { error: "Chat not found", success: false },
        { status: 404 }
      );
    }

    const totalPages = Math.ceil(totalMessageCount / limit);

    return NextResponse.json(
      {
        message: "Chat data fetched successfully",
        data: {
          ...ChatRoom,
          messages: ChatRoom.messages.reverse(),
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages: totalMessageCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching chat:", error);

    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
