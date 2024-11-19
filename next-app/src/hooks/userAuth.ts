import { useState, useEffect } from "react";
import axios from "axios";

export default function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      setAccessToken(data.accessToken);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Google login function
  const googleLogin = async (token: string) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/google", { token });
      setAccessToken(data.accessToken);
      // Store the access token in localStorage (optional)
      localStorage.setItem("accessToken", data.accessToken);
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const { data } = await axios.post("/api/api/auth/refresh");
      setAccessToken(data.accessToken);
    } catch (error) {
      console.error("Error refreshing access token:", error);
      setAccessToken(null);
      localStorage.removeItem("accessToken"); // Remove the token if refresh fails
    }
  };

  // Check if there's a valid token in localStorage and set it on initial load
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Periodically refresh the access token every 14 minutes (840,000 milliseconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (accessToken) {
        refreshAccessToken();
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [accessToken]);

  return { accessToken, login, googleLogin, refreshAccessToken, loading };
}
