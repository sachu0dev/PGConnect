import { authenticateRequest } from "@/helpers/AuthenticateUser";
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
    const { chatId, pgId, message } = body;

    if (!chatId && !pgId) {
      return NextResponse.json(
        { error: "ChatId is required", success: false },
        { status: 400 }
      );
    }

    const checkPg = await prisma.pg.findUnique({
      where: { id: pgId },
    });

    if (!checkPg) {
      return NextResponse.json(
        { error: "PG not found", success: false },
        { status: 404 }
      );
    }

    let ChatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatId },
    });

    if (ChatRoom) {
      return NextResponse.json(
        {
          error: "Chat already exists",
          data: ChatRoom,
          success: false,
        },
        { status: 403 }
      );
    } else {
      ChatRoom = await prisma.chatRoom.create({
        data: {
          id: chatId,
          pgId: pgId,
        },
      });
    }

    await prisma.message.create({
      data: {
        chatRoomId: ChatRoom.id,
        senderId: userId,
        text: message,
      },
    });

    return NextResponse.json(
      {
        message: "Message sent successfully",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error:", error);

    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
