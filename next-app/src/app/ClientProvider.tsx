"use client";

import { useEffect, useRef } from "react";
import { refreshUser, logout } from "@/lib/features/user/userSlice";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const accessToken = useAppSelector(
    (state: RootState) => state.user.accessToken
  );

  const hasRefreshedToken = useRef(false);

  useEffect(() => {
    const initializeUser = async () => {
      if (!accessToken && !hasRefreshedToken.current) {
        hasRefreshedToken.current = true;
        try {
          console.log("Attempting to refresh token...");

          const response = await api.post("/api/auth/refresh");
          const newAccessToken = response.data.accessToken;
          dispatch(refreshUser(newAccessToken));
        } catch (error) {
          dispatch(logout());
        }
      }
    };

    initializeUser();
  }, [dispatch, accessToken, router]);

  return <>{children}</>;
}
