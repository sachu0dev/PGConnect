"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

/** Sends already signed-in visitors away from guest-only auth pages. */
export function useRedirectIfAuthenticated(next: string) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);
  return status;
}
