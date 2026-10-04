"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ImageIcon, MessageSquareText, PhoneCall, RefreshCw } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { StartChatButton } from "@/components/chat/start-chat-button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import { formatINR, titleCase } from "@/lib/format";
import type { Enquiry } from "./types";

const STATUS: Record<Enquiry["status"], { label: string; variant: BadgeProps["variant"] }> = {
  NEW: { label: "Sent to owner", variant: "warning" },
  CONTACTED: { label: "Owner responded", variant: "success" },
  CLOSED: { label: "Closed", variant: "muted" },
};

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const visitFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

export function EnquiriesList() {
  const { ready } = useRequireAuth();
  const [items, setItems] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setError(null);
    api<Enquiry[]>("/api/account/enquiries", { signal: controller.signal })
      .then(setItems)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err, "Couldn't load your enquiries"));
      });
    return () => controller.abort();
  }, [ready, attempt]);

  if (error) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load your enquiries"
        description={error}
        action={<Button onClick={() => setAttempt((a) => a + 1)}>Try again</Button>}
      />
    );
  }

  if (!items) {
    return (
      <ul className="space-y-4" aria-busy="true" aria-label="Loading enquiries">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex gap-4 rounded-xl border p-4">
            <Skeleton className="size-20 shrink-0 rounded-lg sm:size-24" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-28" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={PhoneCall}
        title="No enquiries yet"
        description="When you request a callback or book a visit, you can track the owner's response here."
        action={
          <Button asChild>
            <Link href="/pgs">Find a PG</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <EnquiryRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function EnquiryRow({ item }: { item: Enquiry }) {
  const status = STATUS[item.status];
  const location = [item.pg.locality, titleCase(item.pg.city)].filter(Boolean).join(", ");
  const isVisit = item.type === "VISIT";
  const TypeIcon = isVisit ? CalendarDays : PhoneCall;

  return (
    <li className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
          {item.pg.image ? (
            <Image src={item.pg.image} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            {item.pg.available ? (
              <Link href={`/pg/${item.pg.id}`} className="line-clamp-2 font-semibold hover:text-primary hover:underline">
                {item.pg.name}
              </Link>
            ) : (
              <p className="line-clamp-2 font-semibold">{item.pg.name}</p>
            )}
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {location} · {formatINR(item.pg.rentPerMonth)}/month
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <TypeIcon className="size-4 text-primary" aria-hidden />
              {isVisit
                ? `Visit${item.visitDate ? ` on ${visitFmt.format(new Date(item.visitDate))}` : ""}`
                : "Callback request"}
            </span>
            <span className="text-muted-foreground">· Sent {dateFmt.format(new Date(item.createdAt))}</span>
          </p>
          {!item.pg.available ? (
            <p className="text-xs text-muted-foreground">This listing is no longer available.</p>
          ) : null}
        </div>
      </div>
      {item.pg.available ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {item.pg.chatId ? (
            <Button asChild size="sm">
              <Link href={`/chat/${item.pg.chatId}`}>
                <MessageSquareText /> Open chat
              </Link>
            </Button>
          ) : (
            <StartChatButton pgId={item.pg.id} ownerId={item.pg.ownerId} size="sm" />
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/pg/${item.pg.id}`}>View PG</Link>
          </Button>
        </div>
      ) : null}
    </li>
  );
}
