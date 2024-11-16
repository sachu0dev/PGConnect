import { NextResponse } from "next/server";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/jwt";
import { cookies } from "next/headers"; // For working with cookies in App Router
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

// Mock function to fetch user from DB
const getUserById = async (userId: string) => {
  await dbConnect();
  const user = await UserModel.findById(userId);
  return user;
};

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  if (!refreshToken) {
    return NextResponse.json(
      { message: "No refresh token found" },
      { status: 401 }
    );
  }

  try {
    const { userId } = verifyRefreshToken(refreshToken.value);
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Set new refresh token in cookies
    const response = NextResponse.json({ accessToken: newAccessToken });
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set secure flag for production
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid refresh token" },
      { status: 401 }
    );
  }
}
