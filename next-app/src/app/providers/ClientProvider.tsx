"use client";

import api from "@/lib/axios";
import { logout, refreshUser, setLoading } from "@/lib/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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
          dispatch(setLoading(true));

          const response = await api.post("/api/auth/refresh");
          const newAccessToken = response.data.accessToken;
          dispatch(refreshUser(newAccessToken));
        } catch (error) {
          console.log(error);

          dispatch(logout());
        } finally {
          dispatch(setLoading(false));
        }
      }
    };

    initializeUser();
  }, [dispatch, accessToken, router]);

  return <>{children}</>;
}
