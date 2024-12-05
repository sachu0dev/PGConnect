import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Gender } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = parseInt(searchParams.get("limit") || "10", 10);

    // Extracting the payload
    const payload = searchParams.get("payload");
    let additionalFilters = {};

    // Parse the payload if it exists
    if (payload) {
      try {
        additionalFilters = JSON.parse(payload);
      } catch (error) {
        console.error("Invalid payload format:", error);
        return NextResponse.json(
          { success: false, error: "Invalid payload format" },
          { status: 400 }
        );
      }
    }

    const filters: Prisma.PgWhereInput = {
      isAcceptingGuest: true,
      ...additionalFilters, // Apply additional filters from payload
    };

    if (city) {
      filters.city = {
        contains: city.toLowerCase(),
        mode: "insensitive",
      };
    }

    // Address filter
    const address = searchParams.get("address");
    if (address) {
      filters.address = {
        contains: address.toLowerCase(),
        mode: "insensitive",
      };
    }

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

    const [totalCount, pgs] = await Promise.all([
      prisma.pg.count({ where: filters }),
      prisma.pg.findMany({
        where: filters,
        take: parsedLimit,
        skip: (parsedPage - 1) * parsedLimit,
        orderBy: [{ address: "asc" }, { createdAt: "desc" }],
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
