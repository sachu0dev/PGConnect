import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import UserModel, { User } from "@/model/User";

const getUserByEmail = async (email: string): Promise<User | null> => {
  await dbConnect();
  const user = await UserModel.findOne({ email });
  return user;
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await getUserByEmail(email);

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ accessToken }, { status: 200 });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
