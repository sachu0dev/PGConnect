import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const userId = authResult;

    const userPgs = await prisma.pg.findMany({
      where: {
        owner: {
          id: userId,
        },
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        coordinates: true,
        rentPerMonth: true,
        isDummy: true,
        bhk: true,
        gender: true,
        capacityCount: true,
        createdAt: true,
        capacity: true,
        images: true,
        description: true,
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: userPgs,
    });
  } catch (error) {
    console.log("PG Search Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
