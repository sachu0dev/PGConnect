import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { deleteFromS3, uploadToS3 } from "@/lib/uploadS3";

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const body = await request.json();
    const { pgId, imageUrl } = body;

    if (!pgId || !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const userPg = await prisma.pg.findUnique({
      where: {
        id: pgId,
      },
    });

    if (!userPg) {
      return NextResponse.json(
        { success: false, error: "PG not found" },
        { status: 404 }
      );
    }

    if (userPg.images.length <= 3) {
      return NextResponse.json(
        { success: false, error: "Minimum 3 images required" },
        { status: 400 }
      );
    }

    if (userPg.ownerId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const updatedImages = userPg.images.filter((image) => image !== imageUrl);

    const updatedPg = await prisma.pg.update({
      where: {
        id: pgId,
      },
      data: {
        images: updatedImages,
      },
    });

    await deleteFromS3(imageUrl);

    return NextResponse.json({
      success: true,
      data: updatedPg,
    });
  } catch (error) {
    console.error("PG Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const formData = await request.formData();

    const pgId = formData.get("pgId") as string;
    const images = formData.getAll("images") as File[];

    if (!pgId) {
      return NextResponse.json(
        { success: false, error: "PG ID is required" },
        { status: 400 }
      );
    }

    const userPg = await prisma.pg.findUnique({
      where: {
        id: pgId,
        ownerId: userId,
      },
    });

    if (!userPg) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const MAX_IMAGES = 6;
    const currentImageCount = userPg.images.length;
    const newImagesCount = images.length;

    if (currentImageCount + newImagesCount > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_IMAGES} images allowed. You currently have ${currentImageCount} images.`,
        },
        { status: 400 }
      );
    }

    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const invalidFiles = images.filter(
      (file) =>
        !validImageTypes.includes(file.type) || file.size > MAX_FILE_SIZE
    );

    if (invalidFiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid files. Only JPEG, PNG, GIF, and WEBP files under 5MB are allowed.",
        },
        { status: 400 }
      );
    }

    const imageUrls = await Promise.all(
      images.map((image) => uploadToS3(image, userId))
    );

    const updatedPg = await prisma.pg.update({
      where: { id: pgId },
      data: {
        images: [...userPg.images, ...imageUrls],
      },
    });

    return NextResponse.json({
      success: true,
      message: `${imageUrls.length} images uploaded successfully`,
      data: updatedPg,
    });
  } catch (error) {
    console.error("PG Image Upload Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
