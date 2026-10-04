"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { api, errorMessage } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";

/** Switches the signed-in user to an owner account, then opens the listing form. */
export function useBecomeOwner(next = "/dashboard/post-pg") {
  const { setUser } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const becomeOwner = useCallback(async () => {
    setPending(true);
    try {
      const user = await api<PublicUser>("/api/dashboard/become-owner", { method: "POST" });
      setUser(user);
      toast.success("You're all set to list your PG");
      router.push(next);
    } catch (error) {
      toast.error(errorMessage(error, "Could not switch to an owner account"));
    } finally {
      setPending(false);
    }
  }, [next, router, setUser]);

  return { becomeOwner, pending };
}
