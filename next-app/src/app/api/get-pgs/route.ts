import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Received GET request:", request.nextUrl);

    const { searchParams } = request.nextUrl;
    console.log("Search Params:", searchParams.toString());

    const city = searchParams.get("city");
    console.log("City parameter:", city);

    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = parseInt(searchParams.get("limit") || "10", 10);
    console.log("Parsed Page:", parsedPage, "Parsed Limit:", parsedLimit);

    // Initialize the filters object
    const filters: Record<string, any> = {};

    // If a city is provided, include it in the filter
    if (city) {
      filters.city = { contains: city.toLowerCase(), mode: "insensitive" };
      console.log("Applied city filter:", filters.city);
    } else {
      console.log("No city filter applied, fetching all PGs.");
    }

    // Add filters for rent, gender, and bhk if available in the query parameters
    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    const gender = searchParams.get("gender");
    const bhk = searchParams.get("bhk");

    if (minRent) {
      filters.rentPerMonth = {
        ...filters.rentPerMonth,
        gte: parseFloat(minRent),
      };
      console.log("Applied minRent filter:", filters.rentPerMonth);
    }

    if (maxRent) {
      filters.rentPerMonth = {
        ...filters.rentPerMonth,
        lte: parseFloat(maxRent),
      };
      console.log("Applied maxRent filter:", filters.rentPerMonth);
    }

    if (gender && gender !== "null") {
      filters.gender = gender;
      console.log("Applied gender filter:", filters.gender);
    }

    if (bhk && bhk !== "null") {
      filters.bhk = parseInt(bhk, 10);
      console.log("Applied bhk filter:", filters.bhk);
    }

    filters.isAcceptingGuest = true;

    // Fetch total count and paginated data
    console.log("Fetching data with filters:", filters);
    const [totalCount, pgs] = await Promise.all([
      prisma.pg.count({ where: filters }),
      prisma.pg.findMany({
        where: filters,
        take: parsedLimit,
        skip: (parsedPage - 1) * parsedLimit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          coordinates: true,
          rentPerMonth: true,

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

    console.log("Fetched total count:", totalCount);
    console.log("Fetched PGs:", pgs);

    // Return the response with pagination and data
    const pagination = {
      total: totalCount,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalCount / parsedLimit),
      hasNextPage: parsedPage * parsedLimit < totalCount,
      hasPrevPage: parsedPage > 1,
    };

    console.log("Pagination data:", pagination);

    return NextResponse.json({
      success: true,
      data: pgs,
      pagination,
    });
  } catch (error) {
    console.error("PG Search Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
