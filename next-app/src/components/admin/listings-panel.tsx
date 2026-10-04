"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, Building2, CircleCheck, ExternalLink, Flag, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errorMessage } from "@/lib/api-client";
import { formatINR, titleCase } from "@/lib/format";
import type { AdminListing } from "@/server/admin";
import { ListingStatusBadge } from "./listing-status-badge";
import {
  AdminPageHeader,
  AdminPagination,
  DataTable,
  DateCell,
  ErrorPanel,
  ListSkeleton,
  MobileCard,
  SearchForm,
  useAdminList,
} from "./shared";

type StatusFilter = "ALL" | AdminListing["status"];

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
      {src ? (
        <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
      ) : (
        <ImageOff className="absolute inset-0 m-auto size-4 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

export function ListingsPanel() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload, updateItem } = useAdminList<AdminListing>("/api/admin/pgs", {
    q: q || undefined,
    status: status === "ALL" ? undefined : status,
    page,
  });
  const [confirming, setConfirming] = useState<AdminListing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function changeStatus(listing: AdminListing, next: AdminListing["status"]) {
    setBusyId(listing.id);
    try {
      const updated = await api<AdminListing>(`/api/admin/pgs/${listing.id}`, {
        method: "PATCH",
        body: { status: next },
      });
      updateItem((l) => l.id === listing.id, status === "ALL" || updated.status === status ? updated : null);
      toast.success(next === "BLOCKED" ? `“${listing.name}” is now hidden` : `“${listing.name}” is live again`);
      setConfirming(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const actions = (listing: AdminListing) => (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/pg/${listing.id}`} target="_blank">
          <ExternalLink /> View
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </Button>
      {listing.status === "BLOCKED" ? (
        <Button variant="outline" size="sm" loading={busyId === listing.id} onClick={() => changeStatus(listing, "ACTIVE")}>
          <CircleCheck /> Unblock
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={busyId === listing.id}
          onClick={() => setConfirming(listing)}
        >
          <Ban /> Block
        </Button>
      )}
    </div>
  );

  const reportsBadge = (listing: AdminListing) =>
    listing.openReports > 0 ? (
      <Badge variant="warning">
        <Flag /> {listing.openReports} open
      </Badge>
    ) : null;

  const items = data?.items ?? [];

  return (
    <>
      <AdminPageHeader
        title="Listings"
        description="Search every PG on the platform and block anything that breaks the rules."
        actions={
          <>
            <SearchForm
              initial={q}
              placeholder="Name, city, locality or owner email"
              onSearch={(value) => {
                setQ(value);
                setPage(1);
              }}
            />
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {error ? (
        <ErrorPanel message={error} onRetry={reload} />
      ) : loading && !data ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No listings found"
          description={q ? `Nothing matches “${q}”. Try a city, locality or the owner's email.` : undefined}
        />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <DataTable head={["Listing", "Owner", "Rent", "Status", "Created", ""]}>
            {items.map((listing) => (
              <tr key={listing.id}>
                <td className="max-w-[20rem] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb src={listing.image} alt={listing.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{listing.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[listing.locality, titleCase(listing.city)].filter(Boolean).join(", ")} ·{" "}
                        {listing.views.toLocaleString("en-IN")} views
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="flex items-center gap-1.5">
                    {listing.owner.username}
                    {listing.owner.isBanned ? <Badge variant="destructive">Banned</Badge> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{listing.owner.email}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatINR(listing.rentPerMonth)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <ListingStatusBadge status={listing.status} />
                    {reportsBadge(listing)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <DateCell value={listing.createdAt} />
                </td>
                <td className="px-4 py-3">{actions(listing)}</td>
              </tr>
            ))}
          </DataTable>

          <ul className="space-y-3 md:hidden">
            {items.map((listing) => (
              <MobileCard key={listing.id}>
                <div className="flex items-center gap-3">
                  <Thumb src={listing.image} alt={listing.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{listing.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[listing.locality, titleCase(listing.city)].filter(Boolean).join(", ")} ·{" "}
                      {formatINR(listing.rentPerMonth)}/mo
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <ListingStatusBadge status={listing.status} />
                  {reportsBadge(listing)}
                  <span className="truncate">by {listing.owner.email}</span>
                </div>
                {actions(listing)}
              </MobileCard>
            ))}
          </ul>

          {data ? (
            <AdminPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block “{confirming?.name}”?</DialogTitle>
            <DialogDescription>
              The listing disappears from search and its public page. The owner cannot re-activate it themselves — you
              can unblock it here at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={busyId === confirming?.id}
              onClick={() => confirming && changeStatus(confirming, "BLOCKED")}
            >
              Block listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
