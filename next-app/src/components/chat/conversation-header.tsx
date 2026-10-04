import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";
import type { ChatRoomMeta } from "@/server/chat-queries";
import { PgThumb } from "./pg-thumb";
import { UserAvatar } from "./user-avatar";

export function ConversationHeader({ meta, typing }: { meta: ChatRoomMeta | null; typing: boolean }) {
  return (
    <div className="border-b bg-background">
      <div className="flex items-center gap-2 px-2 py-2 sm:px-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 md:hidden">
          <Link href="/chat" aria-label="Back to all conversations">
            <ArrowLeft />
          </Link>
        </Button>

        {meta ? (
          <>
            <UserAvatar name={meta.counterpart.username} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">{meta.counterpart.username}</p>
              <p className="truncate text-xs text-muted-foreground" aria-live="polite">
                {typing ? (
                  <span className="font-medium text-primary">typing…</span>
                ) : meta.role === "tenant" ? (
                  <>Owner of {meta.pg.name}</>
                ) : (
                  <>Interested in {meta.pg.name}</>
                )}
              </p>
            </div>
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={meta.pg.href} aria-label={`View ${meta.pg.name} listing`} target="_blank" rel="noopener">
                <ExternalLink />
              </Link>
            </Button>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-3 py-0.5">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        )}
      </div>

      {meta ? (
        <Link
          href={meta.pg.href}
          className="mx-2 mb-2 flex items-center gap-3 rounded-xl border bg-muted/40 p-2 pr-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mx-4"
        >
          <PgThumb src={meta.pg.image} alt={meta.pg.name} size={44} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{meta.pg.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {[meta.pg.locality, meta.pg.city].filter(Boolean).join(", ")}
              {!meta.pg.isActive ? " · Not taking enquiries" : ""}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-bold text-primary">{formatINR(meta.pg.rentPerMonth)}</span>
            <span className="block text-[11px] text-muted-foreground">per month</span>
          </span>
        </Link>
      ) : null}
    </div>
  );
}
