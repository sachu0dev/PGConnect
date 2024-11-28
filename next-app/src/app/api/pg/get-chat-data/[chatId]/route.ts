import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: { chatId: string } }
) {
  const { chatId } = context.params;

  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!chatId) {
      return NextResponse.json(
        { error: "ChatId is required", success: false },
        { status: 400 }
      );
    }

    const ChatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        messages: {
          select: {
            id: true,
            text: true,
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

    return NextResponse.json(
      {
        message: "Chat data fetched successfully",
        data: ChatRoom,
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
