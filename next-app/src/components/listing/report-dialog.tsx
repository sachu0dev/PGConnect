"use client";

import { useId, useState, type FormEvent } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api-client";
import { REPORT_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useListingViewer } from "./viewer-provider";

type Reason = (typeof REPORT_REASONS)[number]["value"];

export function ReportDialog({ className }: { className?: string }) {
  const id = useId();
  const { pgId, requireLogin } = useListingViewer();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reason) {
      setError("Choose what's wrong with this listing");
      return;
    }
    setSubmitting(true);
    try {
      await api(`/api/pg/${pgId}/report`, { method: "POST", body: { reason, details: details.trim() || undefined } });
      toast.success("Thanks for flagging this. Our team will review the listing.");
      setOpen(false);
      setReason(null);
      setDetails("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => requireLogin(() => setOpen(true))}
        className={cn(
          "inline-flex items-center gap-1.5 rounded text-xs font-medium text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <Flag className="size-3.5" aria-hidden /> Report this listing
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this listing</DialogTitle>
            <DialogDescription>
              Reports are confidential. Our moderators review every report and may remove the listing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">What&apos;s wrong?</legend>
              <div role="radiogroup" className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                      reason === r.value ? "border-primary bg-primary/5" : "hover:bg-accent"
                    )}
                  >
                    <input
                      type="radio"
                      name={`${id}-reason`}
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => {
                        setReason(r.value);
                        setError(null);
                      }}
                      className="size-4 accent-[hsl(var(--primary))]"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
              {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            </fieldset>
            <div className="space-y-1.5">
              <label htmlFor={`${id}-details`} className="text-sm font-medium">
                Details <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id={`${id}-details`}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Tell us what happened — e.g. the owner asked for an advance before the visit."
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" loading={submitting}>
                Submit report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
