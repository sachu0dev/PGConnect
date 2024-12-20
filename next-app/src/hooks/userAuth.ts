interface GoogleProps {
  tokenId: string;
}

import { logout } from "@/lib/features/user/userSlice";
import { useAppDispatch } from "@/lib/hooks";
import axios from "axios";
import { useState } from "react";

const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const googleLogin = async ({ tokenId }: GoogleProps) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async () => {
    localStorage.removeItem("accessToken");
    await axios.post("/api/auth/logout");
    dispatch(logout());
    window.location.href = "/";
  };

  return { googleLogin, logOut, isLoading, error };
};

export default useAuth;
