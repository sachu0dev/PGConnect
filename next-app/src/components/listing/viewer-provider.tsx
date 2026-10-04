"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api-client";
import { GUEST_VIEWER, type ViewerState } from "./types";

type ListingViewer = {
  pgId: string;
  state: ViewerState;
  /** True until auth status and /me have resolved. */
  loading: boolean;
  isOwner: boolean;
  update: (patch: Partial<ViewerState>) => void;
  refresh: () => Promise<void>;
  /** Runs `action` for signed-in users; sends guests to login and back. */
  requireLogin: (action: () => void) => void;
};

const ListingViewerContext = createContext<ListingViewer | null>(null);

export function ListingViewerProvider({
  pgId,
  ownerId,
  children,
}: {
  pgId: string;
  ownerId: string;
  children: ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<ViewerState>(GUEST_VIEWER);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setState(await api<ViewerState>(`/api/pg/${pgId}/me`));
    } catch {
      setState(GUEST_VIEWER);
    } finally {
      setLoading(false);
    }
  }, [pgId]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "guest") {
      setState(GUEST_VIEWER);
      setLoading(false);
      return;
    }
    void refresh();
  }, [status, user?.id, refresh]);

  const update = useCallback((patch: Partial<ViewerState>) => setState((s) => ({ ...s, ...patch })), []);

  const requireLogin = useCallback(
    (action: () => void) => {
      if (status === "authenticated") action();
      else router.push(`/login?next=${encodeURIComponent(pathname)}`);
    },
    [status, router, pathname]
  );

  const value = useMemo<ListingViewer>(
    () => ({
      pgId,
      state,
      loading: loading || status === "loading",
      isOwner: Boolean(user && user.id === ownerId) || state.isOwner,
      update,
      refresh,
      requireLogin,
    }),
    [pgId, state, loading, status, user, ownerId, update, refresh, requireLogin]
  );

  return <ListingViewerContext.Provider value={value}>{children}</ListingViewerContext.Provider>;
}

export function useListingViewer(): ListingViewer {
  const ctx = useContext(ListingViewerContext);
  if (!ctx) throw new Error("useListingViewer must be used inside <ListingViewerProvider>");
  return ctx;
}
