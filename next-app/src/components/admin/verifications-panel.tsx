"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, FileText, ShieldCheck, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api-client";
import type { AdminVerification } from "@/server/admin";
import { DocumentViewer } from "./document-viewer";
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

type Status = AdminVerification["status"];

const TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const satisfies readonly { value: Status; label: string }[];

const DOC_LABELS: Record<string, string> = {
  AADHAAR: "Aadhaar",
  PAN: "PAN card",
  DRIVING_LICENCE: "Driving licence",
  VOTER_ID: "Voter ID",
  PASSPORT: "Passport",
  PROPERTY_PAPER: "Property paper",
};

const docLabel = (type: string) => DOC_LABELS[type] ?? type;

function StatusBadge({ status }: { status: Status }) {
  if (status === "APPROVED") return <Badge variant="success">Approved</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export function VerificationsPanel() {
  const [status, setStatus] = useState<Status>("PENDING");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload, updateItem } = useAdminList<AdminVerification>(
    "/api/admin/verifications",
    { status, page }
  );

  const [viewing, setViewing] = useState<AdminVerification | null>(null);
  const [rejecting, setRejecting] = useState<AdminVerification | null>(null);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(item: AdminVerification, decision: "APPROVED" | "REJECTED", reviewNote?: string) {
    setBusyId(item.id);
    try {
      const updated = await api<AdminVerification>(`/api/admin/verifications/${item.id}`, {
        method: "PATCH",
        body: { status: decision, note: reviewNote || undefined },
      });
      // The item no longer belongs to the current tab unless the status is unchanged.
      updateItem((v) => v.id === item.id, updated.status === status ? updated : null);
      toast.success(
        decision === "APPROVED"
          ? `${item.fullName} is now a verified owner`
          : `Rejected — ${item.user.username} has been emailed your note`
      );
      setRejecting(null);
      setNote("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const actions = (item: AdminVerification) => (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!item.hasDocument}
        onClick={() => setViewing(item)}
        title={item.hasDocument ? undefined : "No document on file"}
      >
        <FileText /> View document
      </Button>
      {item.status !== "APPROVED" ? (
        <Button size="sm" loading={busyId === item.id} onClick={() => decide(item, "APPROVED")}>
          <Check /> Approve
        </Button>
      ) : null}
      {item.status !== "REJECTED" ? (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={busyId === item.id}
          onClick={() => {
            setNote(item.reviewNote ?? "");
            setRejecting(item);
          }}
        >
          <X /> Reject
        </Button>
      ) : null}
    </div>
  );

  const items = data?.items ?? [];

  return (
    <>
      <AdminPageHeader
        title="Owner verifications"
        description="Match the name and the last 4 characters with the uploaded ID before approving."
      />
      <StatusTabs
        label="Verification status"
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
          icon={ShieldCheck}
          title={status === "PENDING" ? "All caught up" : "Nothing here yet"}
          description={
            status === "PENDING"
              ? "No owners are waiting for verification right now."
              : `No ${status.toLowerCase()} verification requests.`
          }
        />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <DataTable head={["Owner", "Name on ID", "Document", "Status", "Submitted", ""]}>
            {items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.user.username}</p>
                  <p className="text-xs text-muted-foreground">{item.user.email}</p>
                </td>
                <td className="px-4 py-3">{item.fullName}</td>
                <td className="px-4 py-3">
                  <p>{docLabel(item.documentType)}</p>
                  <p className="font-mono text-xs text-muted-foreground">•••• {item.documentLast4}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                  {item.reviewNote ? (
                    <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">{item.reviewNote}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <DateCell value={item.createdAt} />
                </td>
                <td className="px-4 py-3">{actions(item)}</td>
              </tr>
            ))}
          </DataTable>

          <ul className="space-y-3 md:hidden">
            {items.map((item) => (
              <MobileCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.user.username} · {item.user.email}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Document</dt>
                    <dd>
                      {docLabel(item.documentType)} <span className="font-mono">•••• {item.documentLast4}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Submitted</dt>
                    <dd>
                      <DateCell value={item.createdAt} />
                    </dd>
                  </div>
                </dl>
                {item.reviewNote ? <p className="text-xs text-muted-foreground">Note: {item.reviewNote}</p> : null}
                {actions(item)}
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

      <DocumentViewer
        verificationId={viewing?.id ?? null}
        title={viewing ? `${docLabel(viewing.documentType)} — ${viewing.fullName}` : "Document"}
        open={viewing !== null}
        onOpenChange={(open) => !open && setViewing(null)}
      />

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (rejecting && note.trim()) void decide(rejecting, "REJECTED", note.trim());
            }}
          >
            <DialogHeader>
              <DialogTitle>Reject verification</DialogTitle>
              <DialogDescription>
                {rejecting?.fullName} will get an email with your note and can re-submit from their dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="reject-note">Reason for the owner</Label>
              <Textarea
                id="reject-note"
                required
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. The photo is blurry — please upload a clear photo of the front side."
              />
              <p className="text-right text-xs text-muted-foreground">{note.length}/500</p>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRejecting(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={!note.trim()} loading={busyId === rejecting?.id}>
                Reject & notify owner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
