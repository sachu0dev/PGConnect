"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/providers/auth-provider";
import { useRealtimeConnected, useRealtimeEvent } from "@/hooks/use-realtime";

export const UNREAD_REFRESH_EVENT = "pgconnect:unread-refresh";

/**
 * Unread message count for the header badge. Refreshes on realtime
 * "message:new" / "message:read" events, on UNREAD_REFRESH_EVENT (dispatched
 * by chat screens after reading), on focus, and by polling (slower while the
 * socket is connected).
 */
export function useUnreadCount(intervalMs = 45_000) {
  const { user, status } = useAuth();
  const authenticated = status === "authenticated";
  const [count, setCount] = useState(0);
  const connected = useRealtimeConnected(authenticated);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    api<{ count: number }>("/api/chats/unread")
      .then((d) => setCount(d.count))
      .catch(() => {});
  }, []);

  // Coalesce bursts of events into one request.
  const scheduleLoad = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 300);
  }, [load]);

  useRealtimeEvent(
    "message:new",
    (message) => {
      if (message.senderId !== user?.id) scheduleLoad();
    },
    authenticated
  );
  useRealtimeEvent("message:read", scheduleLoad, authenticated);

  useEffect(() => {
    if (!authenticated) {
      setCount(0);
      return;
    }
    load();
    const every = connected ? Math.max(intervalMs, 120_000) : intervalMs;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, every);
    window.addEventListener(UNREAD_REFRESH_EVENT, scheduleLoad);
    window.addEventListener("focus", scheduleLoad);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(UNREAD_REFRESH_EVENT, scheduleLoad);
      window.removeEventListener("focus", scheduleLoad);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [authenticated, connected, intervalMs, load, scheduleLoad]);

  return count;
}
