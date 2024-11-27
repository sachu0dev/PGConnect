import { verifyAccessToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get("Authorization");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = accessToken?.replace("Bearer ", "");

    const { userId } = verifyAccessToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const User = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        phoneNumber: true,
        id: true,
      },
    });

    if (!User) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User found", User, success: true },
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
