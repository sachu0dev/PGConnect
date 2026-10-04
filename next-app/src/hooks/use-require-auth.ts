"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Redirects guests to /login (preserving where they were going) and, when
 * requested, non-owners / non-admins to the right place.
 */
export function useRequireAuth(options: { owner?: boolean; admin?: boolean } = {}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && user) {
      if (options.admin && !user.isAdmin) router.replace("/");
      else if (options.owner && !user.isOwner && !user.isAdmin) router.replace("/owners");
    }
  }, [status, user, router, pathname, options.admin, options.owner]);

  const allowed =
    status === "authenticated" &&
    !!user &&
    (!options.admin || user.isAdmin) &&
    (!options.owner || user.isOwner || user.isAdmin);

  return { user, status, ready: allowed };
}
