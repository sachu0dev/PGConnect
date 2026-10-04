"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/providers/auth-provider";

export const UNREAD_REFRESH_EVENT = "pgconnect:unread-refresh";

/** Polls the unread message count; chat screens dispatch UNREAD_REFRESH_EVENT. */
export function useUnreadCount(intervalMs = 45_000) {
  const { status } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }
    let active = true;
    const load = () =>
      api<{ count: number }>("/api/chats/unread")
        .then((d) => active && setCount(d.count))
        .catch(() => {});
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, intervalMs);
    window.addEventListener(UNREAD_REFRESH_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(UNREAD_REFRESH_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, [status, intervalMs]);

  return count;
}
