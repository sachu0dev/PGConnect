"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, PhoneCall } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import { leadSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useListingViewer } from "./viewer-provider";
import type { LeadKind, LeadState } from "./types";

const STATUS_LABEL: Record<LeadState, string> = {
  NEW: "Sent — waiting for the owner",
  CONTACTED: "Owner has contacted you",
  CLOSED: "Closed",
};

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type FieldErrors = Partial<Record<"name" | "phoneNumber" | "visitDate" | "message", string>>;

/** Callback / visit request form. Prefilled from the signed-in user's profile. */
export function LeadDialog({
  pgName,
  type: initialType,
  children,
}: {
  pgName: string;
  type: LeadKind;
  /** Render prop for the trigger; receives an `open` handler that enforces login. */
  children: (open: () => void) => ReactNode;
}) {
  const id = useId();
  const { user } = useAuth();
  const { pgId, state, update, requireLogin } = useListingViewer();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeadKind>(initialType);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const show = () =>
    requireLogin(() => {
      setType(initialType);
      setName((n) => n || user?.username || "");
      setPhone((p) => p || user?.phoneNumber || "");
      const existingVisit = state.leads.VISIT?.visitDate;
      if (existingVisit && !visitDate) setVisitDate(existingVisit.slice(0, 10));
      setErrors({});
      setOpen(true);
    });

  const existing = state.leads[type];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = {
      type,
      name,
      phoneNumber: phone,
      message: message || undefined,
      visitDate: type === "VISIT" && visitDate ? visitDate : undefined,
    };
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await api<{ lead: { id: string; type: LeadKind; status: LeadState } }>(`/api/pg/${pgId}/leads`, {
        method: "POST",
        body,
      });
      update({
        canReview: true,
        leads: {
          ...state.leads,
          ...(type === "CALLBACK"
            ? { CALLBACK: { status: res.lead.status, createdAt: new Date().toISOString() } }
            : { VISIT: { status: res.lead.status, visitDate: parsed.data.visitDate?.toISOString() ?? null } }),
        },
      });
      toast.success(
        type === "VISIT"
          ? "Visit request sent! The owner will confirm with you."
          : "Callback requested! The owner will call you soon."
      );
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiClientError && error.details && typeof error.details === "object") {
        const details = error.details as Record<string, string[] | undefined>;
        setErrors({
          name: details.name?.[0],
          phoneNumber: details.phoneNumber?.[0],
          visitDate: details.visitDate?.[0],
          message: details.message?.[0],
        });
      }
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {children(show)}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{type === "VISIT" ? "Schedule a visit" : "Request a callback"}</DialogTitle>
            <DialogDescription>
              {type === "VISIT"
                ? `Pick a day to see ${pgName}. The owner will confirm the time with you.`
                : `The owner of ${pgName} will call you back on this number.`}
            </DialogDescription>
          </DialogHeader>

          <div role="tablist" aria-label="Request type" className="grid grid-cols-2 rounded-lg bg-muted p-1">
            {(
              [
                { value: "CALLBACK", label: "Callback", icon: PhoneCall },
                { value: "VISIT", label: "Visit", icon: CalendarDays },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={type === value}
                onClick={() => {
                  setType(value);
                  setErrors({});
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  type === value ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          {existing ? (
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              {type === "VISIT" && state.leads.VISIT?.visitDate
                ? `Visit requested for ${formatDate(state.leads.VISIT.visitDate)}. `
                : state.leads.CALLBACK
                  ? `Callback requested on ${formatDate(state.leads.CALLBACK.createdAt)}. `
                  : null}
              <span className="font-medium">{STATUS_LABEL[existing.status]}.</span> Sending again updates your request.
            </p>
          ) : null}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor={`${id}-name`} className="text-sm font-medium">
                Your name
              </label>
              <Input
                id={`${id}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={60}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${id}-name-err` : undefined}
              />
              {errors.name ? (
                <p id={`${id}-name-err`} className="text-xs text-destructive">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${id}-phone`} className="text-sm font-medium">
                Mobile number
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id={`${id}-phone`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={14}
                  className="rounded-l-none"
                  aria-invalid={Boolean(errors.phoneNumber)}
                  aria-describedby={errors.phoneNumber ? `${id}-phone-err` : undefined}
                />
              </div>
              {errors.phoneNumber ? (
                <p id={`${id}-phone-err`} className="text-xs text-destructive">
                  {errors.phoneNumber}
                </p>
              ) : null}
            </div>
            {type === "VISIT" ? (
              <div className="space-y-1.5">
                <label htmlFor={`${id}-date`} className="text-sm font-medium">
                  Preferred visit date
                </label>
                <Input
                  id={`${id}-date`}
                  type="date"
                  min={todayISO()}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  aria-invalid={Boolean(errors.visitDate)}
                  aria-describedby={errors.visitDate ? `${id}-date-err` : undefined}
                />
                {errors.visitDate ? (
                  <p id={`${id}-date-err`} className="text-xs text-destructive">
                    {errors.visitDate}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label htmlFor={`${id}-msg`} className="text-sm font-medium">
                Message <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id={`${id}-msg`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={
                  type === "VISIT"
                    ? "E.g. I can come after 6 pm. Looking for a double sharing room."
                    : "E.g. Is a single room available from next month?"
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your number is shared only with this PG&apos;s owner. Never pay any advance before visiting.
            </p>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {existing ? "Update request" : type === "VISIT" ? "Request visit" : "Request callback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
