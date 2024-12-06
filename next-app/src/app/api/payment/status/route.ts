import axios from "axios";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const merchantTransactionId = searchParams.get("id");
    const keyIndex = 1;

    const string =
      `/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}` +
      process.env.PHONEPAY_API_KEY;

    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const options = {
      method: "GET",
      url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": process.env.MERCHANT_ID,
      },
    };

    const response = await axios(options);
    if (response.data.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/success`,
        { status: 301 }
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/failure`,
        { status: 301 }
      );
    }
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    NextResponse.json({ error: error, success: false }, { status: 500 });
  }
}
