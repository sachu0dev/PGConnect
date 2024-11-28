import { verifyAccessToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";
import { pgFormSchema } from "@/schemas/pgFromSchema";
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/uploadS3";

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

    const formData = await req.formData();
    const images = formData.getAll("images") as File[];

    if (images.length < 3) {
      return NextResponse.json(
        { error: "Minimum 3 images required", success: false },
        { status: 400 }
      );
    }

    const imageUrls = await Promise.all(
      images.map((image) => uploadToS3(image, userId))
    );

    const pgData = Object.fromEntries(formData.entries());
    delete pgData.images;

    const parsedData = pgFormSchema.parse({
      ...pgData,
      rentPerMonth: Number(pgData.rentPerMonth),
      bhk: Number(pgData.bhk),
      capacity: Number(pgData.capacity),
      isDummy: pgData.isDummy === "true",
      isAcceptingGuest: pgData.isAcceptingGuest === "true",
    });

    const parsedCity = parsedData.city.trim().toLowerCase();

    const isValidCity = await prisma.city.findUnique({
      where: { name: parsedCity },
    });

    if (!isValidCity) {
      return NextResponse.json(
        { error: "City not found", success: false },
        { status: 404 }
      );
    }

    const newPG = await prisma.pg.create({
      data: {
        ...parsedData,
        city: parsedCity,
        ownerId: userId,
        images: imageUrls,
      },
    });

    return NextResponse.json(
      { message: "PG created successfully", pg: newPG, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error handling POST request:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A PG with these details already exists", success: false },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
