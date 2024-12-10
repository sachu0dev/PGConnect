import { authenticateRequest } from "@/helpers/AuthenticateUser";
import axios, { AxiosError } from "axios";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();

    const data = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: body.transactionId,
      name: body.name,
      amount: body.amount * 100,
      mobileNumber: body.mobile,
      redirectUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/payment/status?id=${body.transactionId}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/payment/status?id=${body.transactionId}`,
      redirectMode: "POST",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(data);

    const payloadBase64 = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadBase64 + "/pg/v1/pay" + process.env.PHONEPAY_API_KEY;

    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prod_url = `https://api.phonepe.com/apis/hermes/pg/v1/pay`;

    const options = {
      method: "POST",
      url: prod_url,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadBase64,
      },
    };

    try {
      const response = await axios(options);
      return NextResponse.json(
        { success: true, data: response.data },
        { status: 200 }
      );
    } catch (axiosError) {
      if (axiosError instanceof AxiosError) {
        console.log("PhonePe API Error:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              message: axiosError.message,
              details: axiosError.response?.data || "Unknown API error",
              status: axiosError.response?.status || 500,
            },
          },
          { status: axiosError.response?.status || 500 }
        );
      }
      console.log("Unexpected error in PhonePe API call:", axiosError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "An unexpected error occurred",
            details: String(axiosError),
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log("Pre-API Call Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Error processing request",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
