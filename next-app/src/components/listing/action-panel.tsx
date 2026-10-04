"use client";

import Link from "next/link";
import { CalendarDays, CircleCheck, PauseCircle, Pencil, PhoneCall, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { StartChatButton } from "@/components/chat/start-chat-button";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ContactReveal } from "./contact-reveal";
import { LeadDialog } from "./lead-dialog";
import { ReportDialog } from "./report-dialog";
import { ShareButton } from "./share-button";
import { useListingViewer } from "./viewer-provider";
import type { LeadState } from "./types";

export type ActionPg = {
  id: string;
  name: string;
  ownerId: string;
  rentPerMonth: number;
  deposit: number;
  bedsAvailable: number;
  status: "ACTIVE" | "PAUSED" | "BLOCKED";
  place: string;
};

const LEAD_STATUS: Record<LeadState, string> = {
  NEW: "sent",
  CONTACTED: "owner contacted you",
  CLOSED: "closed",
};

function PausedBanner() {
  return (
    <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm" role="status">
      <PauseCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <p>
        <span className="font-semibold">Not accepting enquiries right now.</span> The owner has paused this listing —
        it may be full. Save it and check back later.
      </p>
    </div>
  );
}

function shareText(pg: ActionPg) {
  return `${pg.name}, ${pg.place} — from ${formatINR(pg.rentPerMonth)}/month on PGConnect`;
}

/** Price + all tenant actions. Used in the desktop sidebar and inline on phones. */
export function ListingActionCard({ pg, className }: { pg: ActionPg; className?: string }) {
  const { state, loading, isOwner, update } = useListingViewer();
  const paused = pg.status !== "ACTIVE";

  return (
    <div className={cn("space-y-4 rounded-xl border bg-card p-5 shadow-sm", className)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rent starts from</p>
        <p className="text-3xl font-extrabold tracking-tight">
          {formatINR(pg.rentPerMonth)}
          <span className="text-base font-normal text-muted-foreground">/month</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {pg.deposit > 0 ? `Deposit ${formatINR(pg.deposit)}` : "No security deposit"}
          {" · "}
          <span className={pg.bedsAvailable > 0 ? "font-medium text-success" : "font-medium text-destructive"}>
            {pg.bedsAvailable > 0 ? `${pg.bedsAvailable} ${pg.bedsAvailable === 1 ? "bed" : "beds"} available` : "Currently full"}
          </span>
        </p>
      </div>

      {paused ? <PausedBanner /> : null}

      {loading ? (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isOwner ? (
        <div className="space-y-3 rounded-lg bg-secondary/60 p-4">
          <p className="text-sm font-medium">This is your listing.</p>
          <Button asChild className="w-full">
            <Link href={`/dashboard/pgs/${pg.id}`}>
              <Pencil /> Edit listing
            </Link>
          </Button>
        </div>
      ) : !paused ? (
        <div className="space-y-2">
          <StartChatButton
            pgId={pg.id}
            ownerId={pg.ownerId}
            size="lg"
            className="w-full"
            label={state.chatId ? "Continue chat" : "Chat with owner"}
          />
          <div className="grid gap-2">
            <LeadDialog pgName={pg.name} type="CALLBACK">
              {(open) => (
                <Button variant="outline" onClick={open}>
                  {state.leads.CALLBACK ? <CircleCheck className="text-success" /> : <PhoneCall />}
                  Request callback
                </Button>
              )}
            </LeadDialog>
            <LeadDialog pgName={pg.name} type="VISIT">
              {(open) => (
                <Button variant="outline" onClick={open}>
                  {state.leads.VISIT ? <CircleCheck className="text-success" /> : <CalendarDays />}
                  Schedule a visit
                </Button>
              )}
            </LeadDialog>
          </div>
          {state.leads.CALLBACK || state.leads.VISIT ? (
            <p className="text-xs text-muted-foreground">
              {[
                state.leads.CALLBACK ? `Callback request ${LEAD_STATUS[state.leads.CALLBACK.status]}` : null,
                state.leads.VISIT ? `Visit request ${LEAD_STATUS[state.leads.VISIT.status]}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          <ContactReveal />
        </div>
      ) : null}

      <div className="flex gap-2">
        <FavoriteButton
          pgId={pg.id}
          variant="inline"
          initial={state.saved}
          onChange={(saved) => update({ saved })}
          className="flex-1"
        />
        <ShareButton title={pg.name} text={shareText(pg)} className="flex-1" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" aria-hidden /> Zero brokerage
        </p>
        {!isOwner ? <ReportDialog /> : null}
      </div>
    </div>
  );
}

/** Sticky bottom bar on phones with the two most common actions. */
export function MobileActionBar({ pg }: { pg: ActionPg }) {
  const { loading, isOwner } = useListingViewer();
  const paused = pg.status !== "ACTIVE";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold leading-tight">
            {formatINR(pg.rentPerMonth)}
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {paused ? "Not accepting enquiries" : pg.bedsAvailable > 0 ? `${pg.bedsAvailable} beds available` : "Currently full"}
          </p>
        </div>
        {loading ? (
          <Skeleton className="h-10 w-48" />
        ) : isOwner ? (
          <Button asChild>
            <Link href={`/dashboard/pgs/${pg.id}`}>
              <Pencil /> Edit listing
            </Link>
          </Button>
        ) : paused ? (
          <ShareButton title={pg.name} text={shareText(pg)} />
        ) : (
          <>
            <LeadDialog pgName={pg.name} type="CALLBACK">
              {(open) => (
                <Button variant="outline" onClick={open} className="px-3">
                  <PhoneCall /> Callback
                </Button>
              )}
            </LeadDialog>
            <StartChatButton pgId={pg.id} ownerId={pg.ownerId} label="Chat" className="px-4" />
          </>
        )}
      </div>
    </div>
  );
}
