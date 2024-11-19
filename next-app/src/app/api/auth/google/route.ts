import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { token, userType = "user" } = await req.json();
    const cookieStore = await cookies();
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new Error("Invalid token payload");
    }

    const googleId = payload.sub;
    const email = payload.email;
    const username =
      payload.name?.replace(/\s+/g, "_").toLowerCase() || email.split("@")[0];

    if (userType === "pgOwner") {
      let pgOwner = await prisma.pgOwner.findUnique({
        where: { email },
      });

      if (!pgOwner) {
        pgOwner = await prisma.pgOwner.create({
          data: {
            username,
            email,
            phoneNumber: "",
            isVerified: true,
          },
        });
      }

      const accessToken = generateAccessToken(pgOwner.id);
      const refreshToken = generateRefreshToken(pgOwner.id);

      cookieStore.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return NextResponse.json({
        accessToken,
        user: {
          id: pgOwner.id,
          email: pgOwner.email,
          username: pgOwner.username,
          isPgOwner: true,
        },
      });
    } else {
      let user = await prisma.user.findUnique({
        where: { googleId },
      });

      if (!user) {
        const existingUserWithEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUserWithEmail) {
          user = await prisma.user.update({
            where: { id: existingUserWithEmail.id },
            data: { googleId },
          });
        } else {
          user = await prisma.user.create({
            data: {
              username,
              email,
              googleId,
              isVerified: true,
            },
          });
        }
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      cookieStore.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return NextResponse.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isPgOwner: false,
        },
      });
    }
  } catch (error) {
    console.error("Google OAuth Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
