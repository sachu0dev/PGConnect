// app/[id]/route.ts

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// This will match the dynamic route [id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const pgData = await prisma.pg.findUnique({
      where: {
        id: id,
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
            phoneNumber: true,
          },
        },
      },
    });

    if (!pgData) {
    }

    return NextResponse.json(
      { message: "successfully fetched data", data: pgData, success: true },
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
