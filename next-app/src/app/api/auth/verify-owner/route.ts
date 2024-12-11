import { authenticateRequest } from "@/helpers/AuthenticateUser";
import prisma from "@/lib/prisma";
import { uploadAadhaarToS3 } from "@/lib/uploadS3";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const aadhaarNumber = formData.get("aadhaarNumber") as string;
  const aadhaarImage = formData.get("aadhaarImage") as File;

  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const userId = authResult;

  console.log("User ID:", userId);
  console.log("Aadhaar Number:", aadhaarNumber);
  console.log("Aadhaar Image:", aadhaarImage);

  if (!aadhaarNumber || !aadhaarImage) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Aadhaar number and verification ID are required",
      }),
      { status: 400 }
    );
  }

  try {
    const imageUrl = await uploadAadhaarToS3(aadhaarImage, userId);

    const updateUser = await prisma.user.update({
      where: { id: userId },
      data: { aadhar: aadhaarNumber, aadharImage: imageUrl, isOwner: true },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Aadhaar verification successful",
        data: updateUser,
      }),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.log("Error during Aadhaar verification:", error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error during verification",
          error: error.message,
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Unexpected error occurred" }),
      { status: 500 }
    );
  }
}
