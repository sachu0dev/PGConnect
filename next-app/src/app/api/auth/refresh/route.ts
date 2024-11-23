import { NextResponse } from "next/server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";

const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
};

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  if (!refreshToken) {
    return NextResponse.json(
      { message: "No refresh token found", success: false },
      { status: 401 }
    );
  }

  try {
    const { userId } = verifyRefreshToken(refreshToken.value);
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found", success: false },
        { status: 404 }
      );
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    const response = NextResponse.json({ accessToken: newAccessToken });
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid refresh token", success: false },
      { status: 401 }
    );
  }
}
