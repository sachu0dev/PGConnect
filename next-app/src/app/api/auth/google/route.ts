import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email;
    const name = payload?.name;

    // Replace with actual DB query
    const user = await findOrCreateUser({ googleId, email, name });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set the refresh token as an HTTP-only cookie
    cookies().set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    // Return the access token in the response
    return NextResponse.json({ accessToken }, { status: 200 });
  } catch (error) {
    console.error("Google OAuth Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
