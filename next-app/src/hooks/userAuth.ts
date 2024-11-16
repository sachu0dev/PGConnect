import { useState, useEffect } from "react";
import axios from "axios";

export default function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const { data } = await axios.post("/api/auth/login", { email, password });
    setAccessToken(data.accessToken);
  };

  const googleLogin = async (token: string) => {
    const { data } = await axios.post("/api/auth/google", { token });
    setAccessToken(data.accessToken);
  };

  const refreshAccessToken = async () => {
    try {
      const { data } = await axios.post("/api/auth/refresh");
      setAccessToken(data.accessToken);
    } catch {
      setAccessToken(null);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshAccessToken, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { accessToken, login, googleLogin };
}
