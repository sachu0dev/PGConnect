import { verifyAccessToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get("Authorization");
    if (!accessToken || !accessToken.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = accessToken.replace("Bearer ", "");
    let decodedToken;

    try {
      decodedToken = verifyAccessToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = decodedToken;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const { city } = await req.json();
    console.log("City received:", city);

    const parsedCity = city.trim().toLowerCase();

    if (parsedCity === "chandigarh") {
      return NextResponse.json(
        { success: true, message: "Service available" },
        { status: 200 }
      );
    }
    const isValidCity = await prisma.city.findUnique({
      where: { name: parsedCity },
    });

    if (!isValidCity) {
      return NextResponse.json(
        { error: "Service not available in this city", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Service available" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating city:", error.message);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
