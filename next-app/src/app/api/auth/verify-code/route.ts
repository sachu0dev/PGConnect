import dbConnect from "@/lib/dbConnect";
import prisma from "@/lib/prisma";
import UserModel from "@/model/User";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, code } = await request.json();
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 500 }
      );
    }

    // const result = verifySchema.safeParse({ code });
    // if (!result.success) {
    //   const codeErros = result.error.format().code?._errors || [];
    //   return Response.json(
    //     {
    //       success: false,
    //       message:
    //         codeErros?.length > 0 ? codeErros.join(", ") : "Invalid code",
    //     },
    //     { status: 400 }
    //   );
    // }

    const isCodeValid = user.verifyCode === code;
    if (!isCodeValid) {
      return Response.json(
        { success: false, message: "Incorrect verification code" },
        { status: 400 }
      );
    }

    const isCodeExpired =
      new Date(user.verifyCodeExpireAt as Date) < new Date();
    if (isCodeExpired) {
      return Response.json(
        {
          success: false,
          message:
            "Verification code has expired please sign up again to get a new code",
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        isVerified: true,
        verifyCode: null,
        verifyCodeExpireAt: null,
      },
    });
    return Response.json(
      { success: true, message: "User verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying user", error);
    return Response.json(
      { success: false, message: "Error verifying user" },
      { status: 500 }
    );
  }
}
