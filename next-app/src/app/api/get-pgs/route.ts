import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Gender } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const find = searchParams.get("find");
    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = parseInt(searchParams.get("limit") || "10", 10);

    const filters: Prisma.PgWhereInput = {
      isAcceptingGuest: true,
    };

    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    const gender = searchParams.get("gender");
    const bhk = searchParams.get("bhk");

    if (minRent || maxRent) {
      filters.rentPerMonth = {
        ...(minRent ? { gte: parseFloat(minRent) } : {}),
        ...(maxRent ? { lte: parseFloat(maxRent) } : {}),
      };
    }

    if (gender && gender !== "null") {
      filters.gender = gender as Gender;
    }

    if (bhk && bhk !== "null") {
      filters.bhk = parseInt(bhk, 10);
    }

    let addressFilter = {};
    if (find) {
      const keywords = find
        .trim()
        .split(/\s+/)
        .map((word) => word.toLowerCase())
        .filter((word) => word !== "india");

      if (keywords.length > 0) {
        addressFilter = {
          OR: keywords.map((keyword) => ({
            address: {
              contains: keyword,
              mode: "insensitive",
            },
          })),
        };
      }
    }

    const combinedFilters = {
      ...filters,
      ...addressFilter,
    };

    const [totalCount, pgs] = await Promise.all([
      prisma.pg.count({ where: combinedFilters }),
      prisma.pg.findMany({
        where: combinedFilters,
        take: parsedLimit,
        skip: (parsedPage - 1) * parsedLimit,
        orderBy: [
          { createdAt: "desc" },
          // Add additional sorting logic based on address match ranking if needed
        ],
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
      }),
    ]);

    const pagination = {
      total: totalCount,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalCount / parsedLimit),
      hasNextPage: parsedPage * parsedLimit < totalCount,
      hasPrevPage: parsedPage > 1,
    };

    return NextResponse.json({
      success: true,
      data: pgs,
      pagination,
    });
  } catch (error) {
    console.log("PG Search Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
