import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const totalCities = await prisma.city.count();
    const totalPGs = await prisma.pg.count();
    const beds = await prisma.pg.aggregate({
      _sum: {
        capacity: true,
      },
    });

    const totalBeds = beds._sum.capacity;

    return NextResponse.json(
      { totalCities, totalPGs, totalBeds, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
