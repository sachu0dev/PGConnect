import type { NextApiRequest, NextApiResponse } from "next";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/jwt";
import { getCookie, setCookie } from "cookies-next";

interface User {
  _id: string;
}

// Mock function to fetch user from DB
const getUserById = async (userId: string): Promise<User | null> => {
  // Implement DB query here
  return null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const refreshToken = getCookie("refreshToken", { req, res });

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    const { userId } = verifyRefreshToken(refreshToken as string);
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    setCookie("refreshToken", newRefreshToken, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}
