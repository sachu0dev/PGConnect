import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const totalCities = await prisma.city.count();
    const totalPGs = await prisma.pg.count();

    if (totalCities === 0 || totalPGs === 0) {
      return NextResponse.json(
        { error: "Internal server error", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { totalCities, totalPGs, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
