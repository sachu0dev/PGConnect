"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  BedDouble,
  Building2,
  ExternalLink,
  Eye,
  ImageIcon,
  MapPin,
  MessageSquareText,
  Pause,
  Pencil,
  PhoneCall,
  Play,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import { formatINR, titleCase } from "@/lib/format";
import type { OwnerListingSummary } from "@/server/owner";
import { ListingStatusPill } from "./badges";
import { ConfirmDialog } from "./confirm-dialog";
import { useDashboard } from "./dashboard-context";
import { DashboardHeading } from "./dashboard-shell";

function Metric({ icon: Icon, label, value, highlight }: { icon: typeof Eye; label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={label}>
      <Icon className="size-3.5" />
      <span className={highlight && value > 0 ? "font-semibold text-primary" : undefined}>{value}</span>
      <span className="sr-only sm:not-sr-only">{label}</span>
    </div>
  );
}

function ListingRow({
  pg,
  onToggle,
  onDelete,
  busy,
}: {
  pg: OwnerListingSummary;
  onToggle: (pg: OwnerListingSummary) => void;
  onDelete: (pg: OwnerListingSummary) => void;
  busy: boolean;
}) {
  const location = [pg.locality, titleCase(pg.city)].filter(Boolean).join(", ");
  return (
    <li className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/dashboard/pgs/${pg.id}`}
          className="relative block aspect-[16/9] w-full shrink-0 bg-muted sm:aspect-auto sm:h-auto sm:w-48"
          aria-label={`Edit ${pg.name}`}
        >
          {pg.image ? (
            <Image src={pg.image} alt="" fill sizes="(max-width: 640px) 100vw, 192px" className="object-cover" />
          ) : (
            <span className="flex h-full min-h-28 items-center justify-center text-muted-foreground">
              <ImageIcon className="size-7" />
            </span>
          )}
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
            {pg.imageCount} photo{pg.imageCount === 1 ? "" : "s"}
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{pg.name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            </div>
            <ListingStatusPill status={pg.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="font-semibold">
              {formatINR(pg.rentPerMonth)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <span
              className={
                pg.bedsAvailable > 0
                  ? "inline-flex items-center gap-1 text-xs font-medium text-success"
                  : "inline-flex items-center gap-1 text-xs font-medium text-destructive"
              }
            >
              <BedDouble className="size-3.5" />
              {pg.bedsAvailable > 0 ? `${pg.bedsAvailable} of ${pg.capacity} beds free` : "Full"}
            </span>
            <Metric icon={Eye} label="views" value={pg.views} />
            <Metric icon={PhoneCall} label="new leads" value={pg.newLeads} highlight />
            <Metric icon={MessageSquareText} label="unread" value={pg.unreadMessages} highlight />
          </div>

          {pg.status === "BLOCKED" ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Hidden by our moderation team. Update the details and contact support to get it reviewed.
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Button size="sm" asChild>
              <Link href={`/dashboard/pgs/${pg.id}`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/pg/${pg.id}`} target="_blank" rel="noopener">
                <ExternalLink /> View
              </Link>
            </Button>
            {pg.status !== "BLOCKED" ? (
              <Button size="sm" variant="outline" onClick={() => onToggle(pg)} loading={busy}>
                {pg.status === "ACTIVE" ? (
                  <>
                    <Pause /> Pause
                  </>
                ) : (
                  <>
                    <Play /> Activate
                  </>
                )}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(pg)}
            >
              <Trash2 /> Delete
            </Button>
            <span className="ml-auto hidden text-xs text-muted-foreground md:inline">
              Updated {formatDistanceToNow(new Date(pg.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export function ListingsView() {
  const { refresh: refreshOverview, overview } = useDashboard();
  const router = useRouter();
  const [items, setItems] = useState<OwnerListingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<OwnerListingSummary | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await api<OwnerListingSummary[]>("/api/dashboard/pgs"));
    } catch (err) {
      setError(errorMessage(err, "Could not load your listings"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (pg: OwnerListingSummary) => {
    const status = pg.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setBusyId(pg.id);
    try {
      await api(`/api/dashboard/pg/${pg.id}`, { method: "PATCH", body: { status } });
      setItems((prev) => prev?.map((p) => (p.id === pg.id ? { ...p, status } : p)) ?? prev);
      toast.success(status === "ACTIVE" ? "Listing is live again" : "Listing paused — it's hidden from search");
      void refreshOverview();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403 && status === "ACTIVE") {
        toast.error(err.message, {
          action: { label: "See plans", onClick: () => router.push("/membership") },
        });
      } else {
        toast.error(errorMessage(err, "Could not update the listing"));
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await api(`/api/dashboard/pg/${toDelete.id}`, { method: "DELETE" });
      setItems((prev) => prev?.filter((p) => p.id !== toDelete.id) ?? prev);
      toast.success("Listing deleted");
      void refreshOverview();
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the listing"));
      return false;
    }
  };

  const plan = overview?.plan;

  return (
    <div className="animate-fade-in">
      <DashboardHeading
        title="My listings"
        description={
          plan
            ? `${plan.used} of ${plan.listingLimit} listing slot${plan.listingLimit === 1 ? "" : "s"} used on the ${plan.name} plan.`
            : "Manage photos, rent, availability and visibility."
        }
        actions={
          <Button asChild>
            <Link href="/dashboard/post-pg">
              <PlusCircle /> Add listing
            </Link>
          </Button>
        }
      />

      {items === null && !error ? (
        <ul className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-40 rounded-xl" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load your listings"
          description={error}
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      ) : items && items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="You haven't listed a PG yet"
          description="Add your PG with rent, sharing options and photos. Tenants nearby can then call, chat or book a visit."
          action={
            <Button asChild>
              <Link href="/dashboard/post-pg">
                <PlusCircle /> Add your first PG
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {items?.map((pg) => (
            <ListingRow key={pg.id} pg={pg} busy={busyId === pg.id} onToggle={toggle} onDelete={setToDelete} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this listing?"
        description={
          <>
            <strong className="text-foreground">{toDelete?.name}</strong> will be removed permanently along with its
            photos, leads and chats. If the PG is just full for now, pause it instead.
          </>
        }
        confirmLabel="Delete listing"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}
