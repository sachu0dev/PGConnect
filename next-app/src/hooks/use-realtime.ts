"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Socket } from "socket.io-client";
import { getAccessToken, onAccessTokenChange, refreshAccessToken } from "@/lib/api-client";
import type { ChatMessage } from "@/server/chat";

/**
 * One shared Socket.IO connection per tab, created lazily (the client library
 * is code-split) and only when NEXT_PUBLIC_SOCKET_URL is configured. Every
 * consumer must also work without it: callers poll while `connected` is false.
 */

export type RealtimeEvents = {
  "message:new": ChatMessage;
  "message:read": { chatId: string; readerId: string };
  typing: { chatId: string; userId: string };
};
type EventName = keyof RealtimeEvents;
type AnyListener = (payload: unknown) => void;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";
export const realtimeEnabled = SOCKET_URL !== "";

let socket: Socket | null = null;
let creating = false;
let connected = false;
let triedRefresh = false;
let socketUserId: string | null = null;
let consumers = 0;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeToken: (() => void) | null = null;

const statusListeners = new Set<() => void>();
const eventListeners = new Map<string, Set<AnyListener>>();
const joinedChats = new Map<string, number>();

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((listener) => listener());
}

function userIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1] ?? "";
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as { userId?: unknown };
    return typeof json.userId === "string" ? json.userId : null;
  } catch {
    return null;
  }
}

function joinOnSocket(chatId: string) {
  socket?.emit("chat:join", { chatId }, (res: { ok: boolean; error?: string } | undefined) => {
    if (!res?.ok) joinedChats.delete(chatId);
  });
}

function destroySocket() {
  if (!socket) return;
  socket.offAny();
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  socketUserId = null;
  setConnected(false);
}

async function createSocket() {
  const token = getAccessToken();
  if (!realtimeEnabled || socket || creating || !token) return;
  creating = true;
  try {
    const { io } = await import("socket.io-client");
    // The token may have changed (or the last consumer left) while loading.
    if (socket || consumers === 0 || !getAccessToken()) return;
    const instance = io(SOCKET_URL, {
      // A function so every (re)connection sends the freshest access token.
      auth: (cb) => cb({ token: getAccessToken() }),
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 15_000,
      timeout: 10_000,
    });
    socket = instance;
    socketUserId = userIdFromToken(token);

    instance.on("connect", () => {
      triedRefresh = false;
      setConnected(true);
      for (const chatId of joinedChats.keys()) joinOnSocket(chatId);
    });
    instance.on("disconnect", () => setConnected(false));
    instance.on("connect_error", (error: Error) => {
      setConnected(false);
      // Middleware rejections are not retried by Socket.IO: refresh once, then retry.
      if (error.message === "unauthorized" && !triedRefresh) {
        triedRefresh = true;
        void refreshAccessToken().then((fresh) => {
          if (fresh && socket === instance) instance.connect();
        });
      }
    });
    instance.onAny((event: string, payload: unknown) => {
      eventListeners.get(event)?.forEach((listener) => listener(payload));
    });
  } catch {
    // Socket library failed to load: callers keep polling.
  } finally {
    creating = false;
  }
}

function handleTokenChange(token: string | null) {
  if (!token) {
    destroySocket();
    return;
  }
  const userId = userIdFromToken(token);
  if (socket && socketUserId && userId !== socketUserId) {
    // A different account signed in on this tab: start over.
    destroySocket();
  }
  if (!socket) {
    void createSocket();
  } else if (!socket.connected) {
    // Reconnect now with the fresh token (auth callback reads it).
    triedRefresh = false;
    socket.connect();
  }
}

function retain() {
  if (!realtimeEnabled) return;
  consumers += 1;
  if (teardownTimer) {
    clearTimeout(teardownTimer);
    teardownTimer = null;
  }
  unsubscribeToken ??= onAccessTokenChange(handleTokenChange);
  void createSocket();
}

function release() {
  if (!realtimeEnabled) return;
  consumers = Math.max(0, consumers - 1);
  if (consumers > 0 || teardownTimer) return;
  // Grace period so client-side navigations don't drop the connection.
  teardownTimer = setTimeout(() => {
    teardownTimer = null;
    if (consumers > 0) return;
    unsubscribeToken?.();
    unsubscribeToken = null;
    destroySocket();
  }, 5_000);
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** True while the shared socket is connected (always false without a socket URL). */
export function useRealtimeConnected(enabled = true): boolean {
  useEffect(() => {
    if (!enabled) return;
    retain();
    return release;
  }, [enabled]);
  return useSyncExternalStore(
    subscribeStatus,
    () => enabled && connected,
    () => false
  );
}

/** Subscribes to a realtime event for the lifetime of the component. */
export function useRealtimeEvent<E extends EventName>(
  event: E,
  handler: (payload: RealtimeEvents[E]) => void,
  enabled = true
) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled || !realtimeEnabled) return;
    retain();
    const listener: AnyListener = (payload) => handlerRef.current(payload as RealtimeEvents[E]);
    let set = eventListeners.get(event);
    if (!set) {
      set = new Set();
      eventListeners.set(event, set);
    }
    set.add(listener);
    return () => {
      eventListeners.get(event)?.delete(listener);
      release();
    };
  }, [event, enabled]);
}

/**
 * Joins `chat:<chatId>` on the socket server (participant-checked there) while
 * mounted, re-joining after reconnects. Returns whether the join succeeded.
 */
export function useChatChannel(chatId: string | null) {
  const isConnected = useRealtimeConnected(Boolean(chatId));
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!chatId || !realtimeEnabled) return;
    joinedChats.set(chatId, (joinedChats.get(chatId) ?? 0) + 1);
    return () => {
      const remaining = (joinedChats.get(chatId) ?? 1) - 1;
      if (remaining <= 0) {
        joinedChats.delete(chatId);
        socket?.emit("chat:leave", { chatId });
      } else {
        joinedChats.set(chatId, remaining);
      }
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !isConnected || !socket) {
      setJoined(false);
      return;
    }
    let active = true;
    socket.emit("chat:join", { chatId }, (res: { ok: boolean } | undefined) => {
      if (active) setJoined(Boolean(res?.ok));
    });
    return () => {
      active = false;
    };
  }, [chatId, isConnected]);

  return { connected: isConnected, joined: isConnected && joined };
}

/** Tells the other participant we're typing (server throttles to 1/sec). */
export function emitTyping(chatId: string) {
  if (socket?.connected) socket.emit("typing", { chatId });
}
