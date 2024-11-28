import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, email, password, phoneNumber } = await request.json();

    const existingUserByUsername = await prisma.user.findFirst({
      where: {
        username,
        isVerified: true,
      },
    });

    if (existingUserByUsername) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Username is already taken",
        }),
        { status: 400 }
      );
    }

    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return new NextResponse(
          JSON.stringify({ success: false, message: "Email is already taken" }),
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          username,
          password: hashedPassword,
          verifyCode,
          verifyCodeExpireAt: new Date(Date.now() + 3600000),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          username: username,
          email: email,
          phoneNumber: phoneNumber,
          password: hashedPassword,
          verifyCode,
          verifyCodeExpireAt: new Date(Date.now() + 3600000),
        },
      });
    }

    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    if (!emailResponse.success) {
      return NextResponse.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "User registered, verification email sent" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error registering user:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Error registering user" }),
      { status: 500 }
    );
  }
}
