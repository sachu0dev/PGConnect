"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshAccessToken, setAccessToken } from "@/lib/api-client";
import type { AuthResponse, PublicUser } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  /** Stores tokens + user returned by login/signup/google endpoints. */
  completeLogin: (response: AuthResponse) => void;
  logout: () => Promise<void>;
  reloadUser: () => Promise<PublicUser | null>;
  setUser: (user: PublicUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const reloadUser = useCallback(async () => {
    try {
      const me = await api<PublicUser>("/api/profile");
      setUserState(me);
      setStatus("authenticated");
      return me;
    } catch {
      setUserState(null);
      setStatus("guest");
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    refreshAccessToken().then((token) => {
      if (cancelled) return;
      if (token) reloadUser();
      else setStatus("guest");
    });
    return () => {
      cancelled = true;
    };
  }, [reloadUser]);

  const completeLogin = useCallback((response: AuthResponse) => {
    setAccessToken(response.accessToken);
    setUserState(response.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Logging out locally is enough if the network call fails.
    }
    setAccessToken(null);
    setUserState(null);
    setStatus("guest");
  }, []);

  const setUser = useCallback((next: PublicUser) => setUserState(next), []);

  const value = useMemo(
    () => ({ user, status, completeLogin, logout, reloadUser, setUser }),
    [user, status, completeLogin, logout, reloadUser, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
