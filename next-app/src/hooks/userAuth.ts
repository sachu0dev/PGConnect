interface GoogleUser {
  googleId: string;
  email: string;
  username: string;
}

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    isPgOwner: boolean;
  };
}

import { useState } from "react";

const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = async (tokenId: string) => {
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
        throw new Error("Login failed");
      }

      const data: AuthResponse = await response.json();

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem(
        "userType",
        data.user.isPgOwner ? "pgOwner" : "user"
      );

      window.location.href = data.user.isPgOwner
        ? "/owner/dashboard"
        : "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { googleLogin, isLoading, error };
};

export default useAuth;
