"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowDown, Ban, MessageCircleQuestion, MessagesSquare, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { emitTyping, useChatChannel, useRealtimeEvent } from "@/hooks/use-realtime";
import { UNREAD_REFRESH_EVENT } from "@/hooks/use-unread-count";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/server/chat";
import type { ChatMessagesPage, ChatRoomMeta } from "@/server/chat-queries";
import {
  QUICK_REPLIES,
  TEMP_ID_PREFIX,
  dayLabel,
  makeTempId,
  mergeMessages,
  sameDay,
  type UiMessage,
} from "./chat-utils";
import { Composer } from "./composer";
import { ConversationHeader } from "./conversation-header";
import { MessageBubble } from "./message-bubble";

const PAGE_SIZE = 30;
const POLL_MS = 5_000;
const NEAR_BOTTOM_PX = 120;
const GROUP_WINDOW_MS = 5 * 60_000;

function notifyUnreadChanged() {
  window.dispatchEvent(new Event(UNREAD_REFRESH_EVENT));
}

export function Conversation({ chatId }: { chatId: string }) {
  const { user } = useAuth();
  const myId = user?.id ?? "";

  const [meta, setMeta] = useState<ChatRoomMeta | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [unseenBelow, setUnseenBelow] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const prependFromHeight = useRef<number | null>(null);
  const lastMessageId = useRef<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRead = useRef(false);
  const knownIds = useRef(new Set<string>());

  const { connected, joined } = useChatChannel(loadState === "ready" ? chatId : null);

  /* ---------------------------- data loading ---------------------------- */

  const mergeIn = useCallback(
    (incoming: UiMessage[]) => {
      let newFromCounterpart = false;
      for (const m of incoming) {
        if (!knownIds.current.has(m.id)) {
          knownIds.current.add(m.id);
          if (m.senderId !== myId) newFromCounterpart = true;
        }
      }
      setMessages((prev) => mergeMessages(prev, incoming));
      return newFromCounterpart;
    },
    [myId]
  );

  /** Latest page; the server marks the counterpart's messages as read. */
  const fetchLatest = useCallback(async () => {
    const page = await api<ChatMessagesPage>(`/api/chats/${chatId}/messages`, { query: { limit: PAGE_SIZE } });
    if (mergeIn(page.items)) notifyUnreadChanged();
    return page;
  }, [chatId, mergeIn]);

  const loadInitial = useCallback(async () => {
    setLoadState("loading");
    try {
      const [room, page] = await Promise.all([
        api<ChatRoomMeta>(`/api/chats/${chatId}`),
        api<ChatMessagesPage>(`/api/chats/${chatId}/messages`, { query: { limit: PAGE_SIZE } }),
      ]);
      setMeta(room);
      page.items.forEach((m) => knownIds.current.add(m.id));
      setMessages((prev) => mergeMessages(prev, page.items));
      setHasMore(page.hasMore);
      setLoadState("ready");
      notifyUnreadChanged();
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 404 || error.status === 400)) {
        setLoadState("not-found");
      } else {
        setLoadError(errorMessage(error, "Could not load this conversation"));
        setLoadState("error");
      }
    }
  }, [chatId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const poll = useCallback(() => {
    fetchLatest().catch(() => {});
  }, [fetchLatest]);

  // Polling fallback while the socket is unavailable.
  useEffect(() => {
    if (connected || loadState !== "ready") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [connected, loadState, poll]);

  // Catch up on anything missed while (re)connecting.
  useEffect(() => {
    if (joined) poll();
  }, [joined, poll]);

  const loadEarlier = useCallback(async () => {
    const oldest = messages.find((m) => !m.id.startsWith(TEMP_ID_PREFIX));
    if (!oldest || loadingEarlier || !hasMore) return;
    setLoadingEarlier(true);
    try {
      const page = await api<ChatMessagesPage>(`/api/chats/${chatId}/messages`, {
        query: { before: oldest.id, limit: PAGE_SIZE },
      });
      prependFromHeight.current = scrollRef.current?.scrollHeight ?? null;
      page.items.forEach((m) => knownIds.current.add(m.id));
      setMessages((prev) => mergeMessages(prev, page.items));
      setHasMore(page.hasMore);
    } catch (error) {
      toast.error(errorMessage(error, "Could not load earlier messages"));
    } finally {
      setLoadingEarlier(false);
    }
  }, [chatId, hasMore, loadingEarlier, messages]);

  /* ------------------------------ read state ----------------------------- */

  const markRead = useCallback(() => {
    if (readTimer.current) clearTimeout(readTimer.current);
    readTimer.current = setTimeout(() => {
      pendingRead.current = false;
      api(`/api/chats/${chatId}/read`, { method: "POST" })
        .then(notifyUnreadChanged)
        .catch(() => {});
    }, 400);
  }, [chatId]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && pendingRead.current) markRead();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (readTimer.current) clearTimeout(readTimer.current);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [markRead]);

  /* ------------------------------- realtime ------------------------------ */

  useRealtimeEvent("message:new", (message) => {
    if (message.chatId !== chatId) return;
    mergeIn([message]);
    if (message.senderId !== myId) {
      setTyping(false);
      pendingRead.current = true;
      if (document.visibilityState === "visible") markRead();
    }
  });

  useRealtimeEvent("message:read", (event) => {
    if (event.chatId !== chatId || event.readerId === myId) return;
    setMessages((prev) =>
      prev.map((m) => (m.senderId === myId && !m.pending && !m.failed && m.status !== "READ" ? { ...m, status: "READ" } : m))
    );
  });

  useRealtimeEvent("typing", (event) => {
    if (event.chatId !== chatId || event.userId === myId) return;
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 3_500);
  });

  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current < 2_000) return;
    lastTypingSent.current = now;
    emitTyping(chatId);
  }, [chatId]);

  /* -------------------------------- sending ------------------------------ */

  const send = useCallback(
    async (text: string, retry?: UiMessage) => {
      const tempId = retry?.id ?? makeTempId();
      const optimistic: UiMessage = {
        id: tempId,
        chatId,
        text,
        senderId: myId,
        createdAt: retry?.createdAt ?? new Date().toISOString(),
        status: "SENT",
        pending: true,
      };
      nearBottom.current = true;
      setMessages((prev) => mergeMessages(prev.filter((m) => m.id !== tempId), [optimistic]));
      setSending(true);
      try {
        const saved = await api<ChatMessage>(`/api/chats/${chatId}/messages`, { method: "POST", body: { text } });
        knownIds.current.add(saved.id);
        setMessages((prev) => mergeMessages(prev.filter((m) => m.id !== tempId), [saved]));
        notifyUnreadChanged();
      } catch (error) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
        toast.error(errorMessage(error, "Message not sent. Please try again."));
      } finally {
        setSending(false);
      }
    },
    [chatId, myId]
  );

  const retry = useCallback(
    (message: UiMessage) => {
      if (!sending) void send(message.text, message);
    },
    [send, sending]
  );

  /* ------------------------------- scrolling ----------------------------- */

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    setUnseenBelow(0);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Older messages were prepended: keep the viewport anchored.
    if (prependFromHeight.current !== null) {
      el.scrollTop += el.scrollHeight - prependFromHeight.current;
      prependFromHeight.current = null;
      return;
    }

    const last = messages[messages.length - 1];
    if (!last || last.id === lastMessageId.current) return;
    const firstRender = lastMessageId.current === null;
    lastMessageId.current = last.id;

    if (firstRender) {
      el.scrollTop = el.scrollHeight;
    } else if (nearBottom.current || last.senderId === myId) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      setUnseenBelow((n) => n + 1);
    }
  }, [messages, myId]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom.current && unseenBelow) setUnseenBelow(0);
    if (el.scrollTop < 80 && hasMore && !loadingEarlier) void loadEarlier();
  };

  /* -------------------------------- render ------------------------------- */

  if (loadState === "not-found") {
    return (
      <div className="flex h-full flex-col">
        <ConversationHeaderBackOnly />
        <div className="flex flex-1 items-center justify-center p-4">
          <EmptyState
            icon={MessagesSquare}
            title="Conversation not found"
            description="This chat doesn’t exist or you’re not part of it."
            action={
              <Button asChild variant="outline">
                <Link href="/chat">Back to messages</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex h-full flex-col">
        <ConversationHeaderBackOnly />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="size-7 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" onClick={() => void loadInitial()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const isTenant = meta?.role === "tenant";
  const showQuickReplies = loadState === "ready" && isTenant && meta?.canSend && messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConversationHeader meta={meta} typing={typing} />

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto overscroll-contain bg-muted/20 px-3 py-3 sm:px-5"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={meta ? `Conversation with ${meta.counterpart.username}` : "Conversation"}
        >
          <SafetyBanner tenant={meta ? isTenant : true} />

          {loadState === "loading" ? (
            <MessagesSkeleton />
          ) : (
            <>
              {hasMore ? (
                <div className="flex justify-center py-2">
                  <Button variant="ghost" size="sm" onClick={() => void loadEarlier()} disabled={loadingEarlier}>
                    {loadingEarlier ? <Spinner className="size-4" label="Loading earlier messages" /> : null}
                    Load earlier messages
                  </Button>
                </div>
              ) : messages.length > 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">This is the start of your conversation</p>
              ) : null}

              {messages.length === 0 ? (
                <EmptyConversationHint tenant={isTenant} name={meta?.counterpart.username ?? ""} />
              ) : (
                messages.map((message, i) => {
                  const prev = messages[i - 1];
                  const newDay = !prev || !sameDay(prev.createdAt, message.createdAt);
                  const grouped =
                    !!prev &&
                    !newDay &&
                    prev.senderId === message.senderId &&
                    new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;
                  return (
                    <Fragment key={message.id}>
                      {newDay ? <DaySeparator iso={message.createdAt} /> : null}
                      <MessageBubble message={message} mine={message.senderId === myId} grouped={grouped} onRetry={retry} />
                    </Fragment>
                  );
                })
              )}
            </>
          )}
        </div>

        {unseenBelow > 0 ? (
          <Button
            size="sm"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-lg"
            onClick={() => scrollToBottom("smooth")}
          >
            <ArrowDown />
            {unseenBelow === 1 ? "1 new message" : `${unseenBelow} new messages`}
          </Button>
        ) : null}
      </div>

      {showQuickReplies ? (
        <div className="flex gap-2 overflow-x-auto border-t bg-background px-3 pt-2 [scrollbar-width:none]" aria-label="Quick questions">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              disabled={sending}
              onClick={() => void send(reply)}
              className="shrink-0 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}

      {meta && !meta.canSend ? (
        <div className="flex items-center gap-2 border-t bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <Ban className="size-4 shrink-0" aria-hidden />
          {meta.blockedReason ?? "You can no longer send messages in this conversation."}
        </div>
      ) : (
        <Composer
          onSend={(text) => void send(text)}
          onTyping={handleTyping}
          sending={sending}
          disabled={loadState !== "ready"}
          autoFocus={loadState === "ready"}
        />
      )}
    </div>
  );
}

function ConversationHeaderBackOnly() {
  return (
    <div className="border-b px-2 py-2 md:hidden">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/chat">← All messages</Link>
      </Button>
    </div>
  );
}

function DaySeparator({ iso }: { iso: string }) {
  return (
    <div className="my-4 flex justify-center" role="separator" aria-label={dayLabel(iso)}>
      <span className="rounded-full bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm ring-1 ring-border">
        {dayLabel(iso)}
      </span>
    </div>
  );
}

function SafetyBanner({ tenant }: { tenant: boolean }) {
  return (
    <div className="mx-auto mb-3 flex max-w-md items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
      {tenant ? (
        <p>
          <strong>Stay safe:</strong> Never pay a token amount before visiting the PG in person. PGConnect never asks
          for payments over chat.
        </p>
      ) : (
        <p>
          <strong>Stay safe:</strong> Keep conversations on PGConnect and never share OTPs or bank details over chat.
        </p>
      )}
    </div>
  );
}

function EmptyConversationHint({ tenant, name }: { tenant: boolean; name: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircleQuestion className="size-6" aria-hidden />
      </span>
      <p className="font-semibold">{tenant ? "Start the conversation" : "No messages yet"}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {tenant
          ? `Ask ${name || "the owner"} about bed availability, food, rules or a visit. Pick a quick question below or type your own.`
          : "Messages from this tenant will appear here."}
      </p>
    </div>
  );
}

function MessagesSkeleton() {
  const rows = [
    { mine: false, w: "w-48" },
    { mine: true, w: "w-40" },
    { mine: false, w: "w-64" },
    { mine: true, w: "w-32" },
    { mine: false, w: "w-52" },
  ];
  return (
    <div className="space-y-3 py-4" aria-busy="true" aria-label="Loading messages">
      {rows.map((row, i) => (
        <div key={i} className={cn("flex", row.mine ? "justify-end" : "justify-start")}>
          <Skeleton className={cn("h-10 rounded-2xl", row.w)} />
        </div>
      ))}
    </div>
  );
}
