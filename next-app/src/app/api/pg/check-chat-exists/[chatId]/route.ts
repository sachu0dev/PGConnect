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

    const existingChat = await prisma.chatRoom.findUnique({
      where: { id: chatId },
    });

    if (!existingChat) {
      return NextResponse.json(
        { error: "Chat not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Chat exists",
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
