"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Eye, Heart, Pause, PhoneCall, Play, RefreshCw, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingForm } from "@/components/owner/listing-form";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import type { EditableListing } from "@/server/owner";
import { ListingStatusPill } from "./badges";
import { ConfirmDialog } from "./confirm-dialog";
import { useDashboard } from "./dashboard-context";

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export function EditListingView({ id }: { id: string }) {
  const router = useRouter();
  const { refresh: refreshOverview } = useDashboard();
  const [listing, setListing] = useState<EditableListing | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setListing(await api<EditableListing>(`/api/dashboard/pg/${id}`));
    } catch (err) {
      setError({
        status: err instanceof ApiClientError ? err.status : 0,
        message: errorMessage(err, "Could not load this listing"),
      });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStatus = async () => {
    if (!listing || listing.status === "BLOCKED") return;
    const status = listing.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setToggling(true);
    try {
      const updated = await api<EditableListing>(`/api/dashboard/pg/${listing.id}`, {
        method: "PATCH",
        body: { status },
      });
      setListing(updated);
      toast.success(status === "ACTIVE" ? "Listing is live again" : "Listing paused — it's hidden from search");
      void refreshOverview();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403 && status === "ACTIVE") {
        toast.error(err.message, { action: { label: "See plans", onClick: () => router.push("/membership") } });
      } else {
        toast.error(errorMessage(err, "Could not update the listing"));
      }
    } finally {
      setToggling(false);
    }
  };

  const remove = async () => {
    if (!listing) return;
    try {
      await api(`/api/dashboard/pg/${listing.id}`, { method: "DELETE" });
      toast.success("Listing deleted");
      void refreshOverview();
      router.push("/dashboard/pgs");
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the listing"));
      return false;
    }
  };

  if (error) {
    return error.status === 404 ? (
      <EmptyState
        icon={SearchX}
        title="Listing not found"
        description="It may have been deleted, or it belongs to a different account."
        action={
          <Button asChild>
            <Link href="/dashboard/pgs">Back to my listings</Link>
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load this listing"
        description={error.message}
        action={<Button onClick={() => void load()}>Try again</Button>}
      />
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link
        href="/dashboard/pgs"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My listings
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight">{listing.name}</h1>
            <ListingStatusPill status={listing.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {listing.status === "ACTIVE"
              ? "Live — tenants can find this PG in search."
              : listing.status === "PAUSED"
                ? "Paused — hidden from search. Activate it when beds free up."
                : "Blocked by moderation — hidden from search. Fix the details and contact support for a review."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/pg/${listing.id}`} target="_blank" rel="noopener">
              <ExternalLink /> Public page
            </Link>
          </Button>
          {listing.status !== "BLOCKED" ? (
            <Button variant="outline" size="sm" onClick={toggleStatus} loading={toggling}>
              {listing.status === "ACTIVE" ? (
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
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat icon={Eye} label="Views" value={listing.stats.views} />
        <Stat icon={PhoneCall} label={`Leads (${listing.stats.newLeads} new)`} value={listing.stats.totalLeads} />
        <Stat icon={Heart} label="Shortlisted" value={listing.stats.saves} />
      </div>

      <ListingForm
        key={listing.id}
        mode="edit"
        listing={listing}
        onSaved={(updated) => {
          setListing(updated);
          void refreshOverview();
        }}
        onImagesChange={(images) => setListing((prev) => (prev ? { ...prev, images } : prev))}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this listing?"
        description="The listing, its photos, leads and chats will be removed permanently. If the PG is just full for now, pause it instead."
        confirmLabel="Delete listing"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}
