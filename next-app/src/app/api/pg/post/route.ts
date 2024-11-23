import { verifyAccessToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";
import { pgFormSchema } from "@/schemas/pgFromSchema";
import { NextRequest, NextResponse } from "next/server";

enum Gender {
  MALE,
  FEMALE,
  ANY,
}

interface CreatePGRequest {
  name: string;
  contact: string;
  city: string;
  address: string;
  rentPerMonth: number;
  gender: Gender;
  isDummy: boolean;
  coordinates: string;
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

    const parsedData = pgFormSchema.parse(data);

    console.log(parsedData.gender);

    const parsedCity = parsedData.city.trim().toLowerCase();
    console.log(parsedCity);

    const isValidCity = await prisma.city.findUnique({
      where: {
        name: parsedCity,
      },
    });

    if (!isValidCity) {
      return NextResponse.json(
        { error: "City not found", success: false },
        { status: 404 }
      );
    }

    const newPG = await prisma.pg.create({
      data: {
        name: parsedData.name,
        contact: parsedData.contact,
        city: parsedCity,
        address: parsedData.address,
        rentPerMonth: parsedData.rentPerMonth,
        gender: parsedData.gender,
        isDummy: parsedData.isDummy ?? false,
        ownerId: userId,
        coordinates: parsedData.coordinates,
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
    console.log(error);

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
