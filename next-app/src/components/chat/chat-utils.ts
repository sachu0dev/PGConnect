import { differenceInCalendarDays, format, isThisYear, isToday, isYesterday } from "date-fns";
import type { ChatMessage } from "@/server/chat";

/** A message as rendered: server messages plus optimistic local ones. */
export type UiMessage = ChatMessage & { pending?: boolean; failed?: boolean };

export const MAX_MESSAGE_LENGTH = 2000;
export const TEMP_ID_PREFIX = "temp-";

export const QUICK_REPLIES = [
  "Is a bed available?",
  "What is included in the rent?",
  "Can I visit today?",
] as const;

export function messageTime(iso: string) {
  return format(new Date(iso), "h:mm a");
}

export function dayLabel(iso: string) {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (differenceInCalendarDays(new Date(), date) < 7) return format(date, "EEEE");
  return format(date, isThisYear(date) ? "d MMMM" : "d MMMM yyyy");
}

/** Compact WhatsApp-style relative time for the inbox. */
export function inboxTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "now";
  if (diffMs < 60 * 60_000) return `${Math.floor(diffMs / 60_000)}m`;
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  if (differenceInCalendarDays(new Date(), date) < 7) return format(date, "EEE");
  return format(date, isThisYear(date) ? "d MMM" : "d MMM yy");
}

export function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** Merges messages by id (incoming wins, except a READ status never regresses). */
export function mergeMessages(current: UiMessage[], incoming: UiMessage[]): UiMessage[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) {
    const existing = byId.get(message.id);
    byId.set(
      message.id,
      existing?.status === "READ" ? { ...existing, ...message, status: "READ" } : { ...existing, ...message }
    );
  }
  return [...byId.values()].sort((a, b) => {
    // Optimistic messages always stay at the bottom until confirmed.
    const pa = a.id.startsWith(TEMP_ID_PREFIX) ? 1 : 0;
    const pb = b.id.startsWith(TEMP_ID_PREFIX) ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt);
  });
}

export function makeTempId() {
  return `${TEMP_ID_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
