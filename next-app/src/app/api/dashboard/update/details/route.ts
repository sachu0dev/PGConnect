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
    const { pgId, contact, capacity, capacityCount, gender, bhk } = body;

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

    // Create an object with only non-null values
    const updateData = Object.fromEntries(
      Object.entries({
        contact,
        capacity,
        capacityCount,
        gender,
        bhk,
      }).filter(([, value]) => value !== null && value !== undefined)
    );

    const updatedPg = await prisma.pg.update({
      where: {
        id: pgId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedPg,
    });
  } catch (error) {
    console.log("PG Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
