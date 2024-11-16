import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { setCookie } from "cookies-next";

interface User {
  _id: string;
  email: string;
  password: string;
}

// Mock function to fetch user from DB (Replace with actual DB query)
const getUserByEmail = async (email: string): Promise<User | null> => {
  // Implement DB query here
  return null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

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
