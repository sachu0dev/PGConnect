"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, MessageSquareText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useRealtimeConnected, useRealtimeEvent } from "@/hooks/use-realtime";
import { UNREAD_REFRESH_EVENT } from "@/hooks/use-unread-count";
import { api, errorMessage } from "@/lib/api-client";
import { pluralize, truncate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatInboxItem, ChatInboxPage } from "@/server/chat-queries";
import { inboxTime } from "./chat-utils";
import { PgThumb } from "./pg-thumb";
import { UserAvatar } from "./user-avatar";

const PAGE_SIZE = 20;
const POLL_MS = 20_000;

export function InboxList({ activeId }: { activeId: string | null }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ChatInboxItem[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const connected = useRealtimeConnected();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedCount = useRef(PAGE_SIZE);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  /** Reloads the first page(s), keeping however many rows are already shown. */
  const refresh = useCallback(async () => {
    try {
      const page = await api<ChatInboxPage>("/api/chats", {
        query: { limit: Math.min(50, Math.max(PAGE_SIZE, loadedCount.current)) },
      });
      // The open conversation is being read right now: never show it as unread.
      setItems(page.items.map((i) => (i.id === activeRef.current && i.unread ? { ...i, unread: 0 } : i)));
      setNextCursor(page.nextCursor);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Could not load your conversations"));
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void refresh(), 250);
  }, [refresh]);

  useEffect(() => {
    void refresh();
    window.addEventListener(UNREAD_REFRESH_EVENT, scheduleRefresh);
    return () => {
      window.removeEventListener(UNREAD_REFRESH_EVENT, scheduleRefresh);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [refresh, scheduleRefresh]);

  // Polling fallback while the socket is unavailable.
  useEffect(() => {
    if (connected) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [connected, refresh]);

  useRealtimeEvent("message:new", scheduleRefresh);
  useRealtimeEvent("message:read", (event) => {
    if (event.readerId === user?.id) {
      setItems((prev) => prev?.map((item) => (item.id === event.chatId ? { ...item, unread: 0 } : item)) ?? prev);
    }
  });

  // Opening a conversation clears its badge immediately.
  useEffect(() => {
    if (!activeId) return;
    setItems((prev) => prev?.map((item) => (item.id === activeId && item.unread ? { ...item, unread: 0 } : item)) ?? prev);
  }, [activeId]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await api<ChatInboxPage>("/api/chats", { query: { cursor: nextCursor, limit: PAGE_SIZE } });
      setItems((prev) => {
        const seen = new Set(prev?.map((i) => i.id));
        const merged = [...(prev ?? []), ...page.items.filter((i) => !seen.has(i.id))];
        loadedCount.current = merged.length;
        return merged;
      });
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = useMemo(() => {
    if (!items || !deferredQuery) return items;
    return items.filter((item) =>
      [item.counterpart.username, item.pg.name, item.pg.locality ?? "", item.pg.city]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery)
    );
  }, [items, deferredQuery]);

  const totalUnread = items?.reduce((sum, item) => sum + (item.unread > 0 ? 1 : 0), 0) ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight">Messages</h1>
          {totalUnread > 0 ? (
            <span className="text-xs font-medium text-muted-foreground">{pluralize(totalUnread, "unread chat")}</span>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="inbox-search" className="sr-only">
            Search conversations
          </label>
          <Input
            id="inbox-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or PG"
            className="pl-9 pr-9"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {filtered === null ? (
          error ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertCircle className="size-6 text-destructive" aria-hidden />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                Try again
              </Button>
            </div>
          ) : (
            <InboxSkeleton />
          )
        ) : items && items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={MessageSquareText}
              title="No conversations yet"
              description="Found a PG you like? Tap “Chat with owner” on the listing to ask about beds, food or visiting times."
              action={
                <Button asChild>
                  <Link href="/pgs">Find a PG</Link>
                </Button>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No conversations match “{query.trim()}”.
          </p>
        ) : (
          <ul className="divide-y" aria-label="Conversations">
            {filtered.map((item) => (
              <InboxRow key={item.id} item={item} active={item.id === activeId} myId={user?.id ?? ""} />
            ))}
          </ul>
        )}

        {nextCursor && !deferredQuery ? (
          <div className="p-3">
            <Button variant="ghost" className="w-full" onClick={loadMore} loading={loadingMore}>
              Load older conversations
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InboxRow({ item, active, myId }: { item: ChatInboxItem; active: boolean; myId: string }) {
  const last = item.lastMessage;
  const preview = last
    ? `${last.senderId === myId ? "You: " : ""}${truncate(last.text.replace(/\s+/g, " "), 80)}`
    : item.role === "tenant"
      ? "Say hello to the owner"
      : "No messages yet";
  const unread = item.unread > 0;

  return (
    <li>
      <Link
        href={`/chat/${item.id}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none",
          active && "bg-accent"
        )}
      >
        <span className="relative">
          <UserAvatar name={item.counterpart.username} className="size-12" />
          <PgThumb
            src={item.pg.image}
            alt=""
            size={22}
            className="absolute -bottom-1 -right-1 rounded-md ring-2 ring-background"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>
              {item.counterpart.username}
            </span>
            <time
              dateTime={item.lastMessageAt}
              className={cn("shrink-0 text-xs", unread ? "font-semibold text-primary" : "text-muted-foreground")}
            >
              {inboxTime(last?.createdAt ?? item.lastMessageAt)}
            </time>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {item.role === "owner" ? "Enquiry for " : ""}
            {item.pg.name}
            {item.pg.locality ? ` · ${item.pg.locality}` : ""}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className={cn("truncate text-sm", unread ? "font-medium text-foreground" : "text-muted-foreground")}>
              {preview}
            </span>
            {unread ? (
              <span
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground"
                aria-label={`${item.unread} unread`}
              >
                {item.unread > 99 ? "99+" : item.unread}
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

function InboxSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading conversations">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}
