import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const userId = authResult;

    const body = await request.json();
    const { pgId, address, city } = body;

    const userPg = await prisma.pg.findUnique({
      where: {
        id: pgId,
        ownerId: userId,
      },
    });

    if (!userPg) {
      return NextResponse.json(
        { success: false, error: "PG not found" },
        { status: 404 }
      );
    }

    const parsedCity = city.trim().toLowerCase();

    const isValidCity = await prisma.city.findUnique({
      where: { name: parsedCity },
    });

    if (!isValidCity) {
      return NextResponse.json(
        { error: "City not found", success: false },
        { status: 404 }
      );
    }

    const updatedPg = await prisma.pg.update({
      where: {
        id: pgId,
      },
      data: {
        address: address,
        city: city,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPg,
    });
  } catch (error) {
    console.log("PG Search Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
