import { verifyAccessToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Define types for better type safety
type Coordinates = {
  lat: number;
  lng: number;
};

interface CreatePGRequest {
  name: string;
  contact: string;
  city: string;
  address: string;
  rentPerMonth: number;
  gender: "male" | "female" | "any";
  isDummy: boolean;
  coordinates: Coordinates;
  bhk: number;
  capacity: number;
  capacityCount: number;
  description: string;
  isAcceptingGuest: boolean;
  images: string[];
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get("Authorization");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = accessToken.replace("Bearer ", "");
    const { userId } = verifyAccessToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const data: CreatePGRequest = await req.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "contact",
      "city",
      "address",
      "rentPerMonth",
      "gender",
      "coordinates",
      "bhk",
      "capacity",
      "description",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (
      data.rentPerMonth <= 0 ||
      data.bhk <= 0 ||
      data.capacity <= 0 ||
      data.capacityCount < 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid numeric values provided",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate city
    const isValidCity = await prisma.city.findUnique({
      where: {
        name: data.city,
      },
    });

    if (!isValidCity) {
      return NextResponse.json(
        { error: "City not found", success: false },
        { status: 404 }
      );
    }

    // Create the PG with all fields
    const newPG = await prisma.pg.create({
      data: {
        name: data.name,
        contact: data.contact,
        city: data.city,
        address: data.address,
        rentPerMonth: data.rentPerMonth,
        gender: data.gender,
        isDummy: data.isDummy ?? false,
        ownerId: userId,
        coordinates: data.coordinates,
        bhk: data.bhk,
        capacity: data.capacity,
        capacityCount: data.capacityCount ?? 0,
        description: data.description,
        isAcceptingGuest: data.isAcceptingGuest ?? true,
        images: data.images ?? [],
      },
    });

    return NextResponse.json(
      {
        message: "PG created successfully",
        pg: newPG,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating PG:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            error: "A PG with these details already exists",
            success: false,
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
