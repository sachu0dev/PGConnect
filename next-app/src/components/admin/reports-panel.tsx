"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Flag, XCircle } from "lucide-react";
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
import { api, errorMessage } from "@/lib/api-client";
import { REPORT_REASONS } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import type { AdminReport } from "@/server/admin";
import { ListingStatusBadge } from "./listing-status-badge";
import {
  AdminPageHeader,
  AdminPagination,
  DataTable,
  DateCell,
  ErrorPanel,
  ListSkeleton,
  MobileCard,
  StatusTabs,
  useAdminList,
} from "./shared";

type Status = AdminReport["status"];

const TABS = [
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
] as const satisfies readonly { value: Status; label: string }[];

const reasonLabel = (reason: string) => REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;

function ReasonBadge({ reason }: { reason: string }) {
  const severe = reason === "SCAM" || reason === "FAKE_LISTING";
  return <Badge variant={severe ? "destructive" : "secondary"}>{reasonLabel(reason)}</Badge>;
}

export function ReportsPanel() {
  const [status, setStatus] = useState<Status>("OPEN");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload, updateItem } = useAdminList<AdminReport>("/api/admin/reports", {
    status,
    page,
  });

  const [deciding, setDeciding] = useState<{ report: AdminReport; status: "RESOLVED" | "DISMISSED" } | null>(null);
  const [blockListing, setBlockListing] = useState(false);
  const [busy, setBusy] = useState(false);

  function openDecision(report: AdminReport, next: "RESOLVED" | "DISMISSED") {
    setBlockListing(
      next === "RESOLVED" &&
        report.pg.status !== "BLOCKED" &&
        (report.reason === "SCAM" || report.reason === "FAKE_LISTING")
    );
    setDeciding({ report, status: next });
  }

  async function submit() {
    if (!deciding) return;
    setBusy(true);
    try {
      const updated = await api<AdminReport>(`/api/admin/reports/${deciding.report.id}`, {
        method: "PATCH",
        body: { status: deciding.status, blockListing: deciding.status === "RESOLVED" && blockListing },
      });
      if (blockListing && deciding.status === "RESOLVED") {
        // Other open reports on the same listing were settled too.
        reload();
      } else {
        updateItem((r) => r.id === updated.id, updated.status === status ? updated : null);
      }
      toast.success(
        deciding.status === "DISMISSED"
          ? "Report dismissed"
          : blockListing
            ? `Report resolved and “${updated.pg.name}” blocked`
            : "Report marked as resolved"
      );
      setDeciding(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const actions = (report: AdminReport) =>
    report.status === "OPEN" ? (
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" onClick={() => openDecision(report, "RESOLVED")}>
          <CheckCircle2 /> Resolve
        </Button>
        <Button variant="outline" size="sm" onClick={() => openDecision(report, "DISMISSED")}>
          <XCircle /> Dismiss
        </Button>
      </div>
    ) : (
      <Badge variant={report.status === "RESOLVED" ? "success" : "muted"}>{titleCase(report.status)}</Badge>
    );

  const listingCell = (report: AdminReport) => (
    <div className="min-w-0">
      <Link
        href={`/pg/${report.pg.id}`}
        target="_blank"
        className="inline-flex items-center gap-1 font-medium hover:text-primary hover:underline"
      >
        <span className="truncate">{report.pg.name}</span>
        <ExternalLink className="size-3 shrink-0" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </Link>
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {titleCase(report.pg.city)} · by {report.pg.owner.username}
        <ListingStatusBadge status={report.pg.status} />
      </p>
    </div>
  );

  const items = data?.items ?? [];

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Listings flagged by tenants. Block anything that asks for advance payment before a visit."
      />
      <StatusTabs
        label="Report status"
        value={status}
        options={TABS}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      {error ? (
        <ErrorPanel message={error} onRetry={reload} />
      ) : loading && !data ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Flag}
          title={status === "OPEN" ? "No open reports" : "Nothing here yet"}
          description={status === "OPEN" ? "Tenants haven't flagged any listings. Nice." : undefined}
        />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <DataTable head={["Listing", "Reason", "Reported by", "When", ""]}>
            {items.map((report) => (
              <tr key={report.id} className="align-top">
                <td className="max-w-[18rem] px-4 py-3">{listingCell(report)}</td>
                <td className="max-w-[22rem] px-4 py-3">
                  <ReasonBadge reason={report.reason} />
                  {report.details ? (
                    <p className="mt-1.5 whitespace-pre-line break-words text-xs text-muted-foreground">{report.details}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{report.reporter.username}</td>
                <td className="px-4 py-3">
                  <DateCell value={report.createdAt} />
                </td>
                <td className="px-4 py-3">{actions(report)}</td>
              </tr>
            ))}
          </DataTable>

          <ul className="space-y-3 md:hidden">
            {items.map((report) => (
              <MobileCard key={report.id}>
                {listingCell(report)}
                <div>
                  <ReasonBadge reason={report.reason} />
                  {report.details ? (
                    <p className="mt-1.5 whitespace-pre-line break-words text-sm text-muted-foreground">{report.details}</p>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reported by {report.reporter.username} · <DateCell value={report.createdAt} />
                </p>
                {actions(report)}
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

      <Dialog open={deciding !== null} onOpenChange={(open) => !open && setDeciding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deciding?.status === "DISMISSED" ? "Dismiss report?" : "Resolve report"}</DialogTitle>
            <DialogDescription>
              {deciding?.status === "DISMISSED"
                ? "Use this when the report is not valid. The listing stays as it is."
                : `Mark the report on “${deciding?.report.pg.name ?? ""}” as handled.`}
            </DialogDescription>
          </DialogHeader>
          {deciding?.status === "RESOLVED" ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-destructive/60 has-[:checked]:bg-destructive/5">
              <input
                type="checkbox"
                checked={blockListing}
                onChange={(e) => setBlockListing(e.target.checked)}
                disabled={deciding.report.pg.status === "BLOCKED"}
                className="mt-0.5 size-4 accent-[hsl(var(--destructive))]"
              />
              <span>
                <span className="font-medium">Block this listing</span>
                <span className="block text-muted-foreground">
                  {deciding.report.pg.status === "BLOCKED"
                    ? "This listing is already blocked."
                    : "Hides it from search and its public page. Other open reports on it are resolved too."}
                </span>
              </span>
            </label>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              variant={deciding?.status === "RESOLVED" && blockListing ? "destructive" : "default"}
              loading={busy}
              onClick={submit}
            >
              {deciding?.status === "DISMISSED"
                ? "Dismiss report"
                : blockListing
                  ? "Resolve & block listing"
                  : "Mark resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
