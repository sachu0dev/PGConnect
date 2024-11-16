import type { NextApiRequest, NextApiResponse } from "next";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { setCookie } from "cookies-next";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const googleId = payload?.sub;
  const email = payload?.email;
  const name = payload?.name;

  // Replace with actual DB query
  const user = await findOrCreateUser({ googleId, email, name });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  setCookie("refreshToken", refreshToken, {
    req,
    res,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({ accessToken });
}
