import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/uploadS3";
import { pgFormSchema } from "@/schemas/pgFromSchema";
import { Pg } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

const MEMBERSHIP_LIMITS: Record<string, number> = {
  FREE: 1,
  BASIC: 5,
  PREMIUM: 20,
};

async function checkMembershipLimit(user: { membership: string; Pg: Pg[] }) {
  const membershipLimit = MEMBERSHIP_LIMITS[user.membership];
  const pgsCount = user.Pg.length;

  if (pgsCount >= membershipLimit) {
    return `Your ${user.membership} membership allows a maximum of ${membershipLimit} PG(s). You have already posted ${pgsCount} PG(s). Upgrade your membership to add more.`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const userId = authResult;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { Pg: true, membership: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found. Please log in and try again.",
          success: false,
        },
        { status: 404 }
      );
    }

    console.log(user);

    const membershipError = await checkMembershipLimit(user);
    if (membershipError) {
      return NextResponse.json(
        { error: membershipError, success: false },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const images = formData.getAll("images") as File[];

    if (images.length < 3) {
      return NextResponse.json(
        {
          error: "At least 3 images are required to create a PG listing.",
          success: false,
        },
        { status: 400 }
      );
    }

    // Upload images
    const imageUrls = await Promise.all(
      images.map((image) => uploadToS3(image, userId))
    );

    // Extract and validate form data
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

    // Handle city name
    const parsedCity = parsedData.city.trim().toLowerCase();

    const city = await prisma.city.upsert({
      where: { name: parsedCity },
      create: { name: parsedCity },
      update: {},
    });

    // Create new PG entry
    const newPG = await prisma.pg.create({
      data: {
        ...parsedData,
        city: city.name,
        ownerId: userId,
        images: imageUrls,
      },
    });

    return NextResponse.json(
      { message: "PG listing created successfully!", pg: newPG, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error handling POST request:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            error:
              "A PG listing with similar details already exists. Please check your input and try again.",
            success: false,
          },
          { status: 409 }
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error:
              "Invalid input data. Please ensure all fields are correctly filled.",
            details: error.errors,
            success: false,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error:
            "An unexpected error occurred while creating the PG listing. Please try again later.",
          success: false,
        },
        { status: 500 }
      );
    }
  }
}
