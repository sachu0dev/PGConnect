import { verifyAccessToken } from "@/lib/auth/jwt";
import { NextResponse } from "next/server";

/**
 * Verifies the access token from the request headers.
 * @param {Request} req - The request object.
 * @returns {string | NextResponse} - Returns the userId if valid, or a JSON response with an error.
 */
export async function authenticateRequest(
  req: Request
): Promise<string | NextResponse> {
  const accessToken = req.headers.get("Authorization");

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = accessToken.replace("Bearer ", "");

  try {
    const { userId } = verifyAccessToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    return userId;
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Invalid token", success: false },
      { status: 401 }
    );
  }
}
