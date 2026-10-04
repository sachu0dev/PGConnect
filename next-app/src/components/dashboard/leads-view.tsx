"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, Inbox, MessageCircle, Phone, PhoneCall, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import type { Paginated } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { LeadStatusValue, OwnerLead, OwnerListingSummary } from "@/server/owner";
import { LEAD_STATUS_LABEL } from "./badges";
import { useDashboard } from "./dashboard-context";
import { DashboardHeading } from "./dashboard-shell";

const TABS: { value: LeadStatusValue | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CLOSED", label: "Closed" },
];

function whatsappLink(lead: OwnerLead) {
  const name = lead.name ?? lead.user.username;
  const ask = lead.type === "VISIT" ? "a visit" : "a callback";
  const text = `Hi ${name}, this is the owner of ${lead.pg.name}. You requested ${ask} on PGConnect — happy to help!`;
  return `https://wa.me/91${lead.phoneNumber}?text=${encodeURIComponent(text)}`;
}

function LeadCard({
  lead,
  onStatusChange,
  saving,
}: {
  lead: OwnerLead;
  onStatusChange: (lead: OwnerLead, status: LeadStatusValue) => void;
  saving: boolean;
}) {
  const displayName = lead.name ?? lead.user.username;
  const selectId = `lead-status-${lead.id}`;
  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-colors",
        lead.status === "NEW" && "border-primary/40 bg-primary/[0.03]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{displayName}</h2>
            <Badge variant={lead.type === "VISIT" ? "default" : "secondary"}>
              {lead.type === "VISIT" ? <CalendarDays /> : <PhoneCall />}
              {lead.type === "VISIT" ? "Visit" : "Callback"}
            </Badge>
            {lead.status === "NEW" ? <Badge variant="warning">New</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            For{" "}
            <Link href={`/dashboard/pgs/${lead.pg.id}`} className="font-medium text-foreground hover:underline">
              {lead.pg.name}
            </Link>{" "}
            · <time dateTime={lead.createdAt}>{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</time>
          </p>
        </div>
        <div className="w-full sm:w-40">
          <Label htmlFor={selectId} className="sr-only">
            Lead status
          </Label>
          <Select
            value={lead.status}
            disabled={saving}
            onValueChange={(value) => onStatusChange(lead, value as LeadStatusValue)}
          >
            <SelectTrigger id={selectId} className="h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(LEAD_STATUS_LABEL) as LeadStatusValue[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {lead.type === "VISIT" && lead.visitDate ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground">
          <CalendarDays className="size-4" /> Wants to visit on {format(new Date(lead.visitDate), "EEE, d MMM yyyy")}
        </p>
      ) : null}
      {lead.message ? (
        <blockquote className="mt-3 border-l-2 pl-3 text-sm text-muted-foreground">{lead.message}</blockquote>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <a href={`tel:+91${lead.phoneNumber}`}>
            <Phone /> Call {lead.phoneNumber}
          </a>
        </Button>
        <Button size="sm" variant="whatsapp" asChild>
          <a href={whatsappLink(lead)} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> WhatsApp
          </a>
        </Button>
      </div>
    </li>
  );
}

export function LeadsView() {
  const { overview, refresh: refreshOverview } = useDashboard();
  const [tab, setTab] = useState<LeadStatusValue | "ALL">("ALL");
  const [pgId, setPgId] = useState<string>("all");
  const [listings, setListings] = useState<OwnerListingSummary[]>([]);
  const [data, setData] = useState<Paginated<OwnerLead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    api<OwnerListingSummary[]>("/api/dashboard/pgs")
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  const query = useCallback(
    (page: number) =>
      api<Paginated<OwnerLead>>("/api/dashboard/leads", {
        query: { status: tab === "ALL" ? undefined : tab, pgId: pgId === "all" ? undefined : pgId, page },
      }),
    [tab, pgId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await query(1));
    } catch (err) {
      setError(errorMessage(err, "Could not load leads"));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    if (!data) return;
    setLoadingMore(true);
    try {
      const next = await query(data.pagination.page + 1);
      setData({ items: [...data.items, ...next.items.filter((n) => !data.items.some((d) => d.id === n.id))], pagination: next.pagination });
    } catch (err) {
      toast.error(errorMessage(err, "Could not load more leads"));
    } finally {
      setLoadingMore(false);
    }
  };

  const changeStatus = async (lead: OwnerLead, status: LeadStatusValue) => {
    if (status === lead.status) return;
    setSavingId(lead.id);
    try {
      const updated = await api<OwnerLead>(`/api/dashboard/leads/${lead.id}`, { method: "PATCH", body: { status } });
      setData((prev) =>
        prev ? { ...prev, items: prev.items.map((l) => (l.id === updated.id ? updated : l)) } : prev
      );
      toast.success(`Marked as ${LEAD_STATUS_LABEL[status].toLowerCase()}`);
      void refreshOverview();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the lead"));
    } finally {
      setSavingId(null);
    }
  };

  const newCount = overview?.leads.new ?? 0;

  return (
    <div className="animate-fade-in">
      <DashboardHeading
        title="Leads"
        description="Callback and visit requests from tenants. Call or WhatsApp them, then update the status."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter by status" className="scrollbar-none flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              type="button"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.value === "NEW" && newCount > 0 ? (
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-primary-foreground">
                  {newCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {listings.length > 1 ? (
          <div className="sm:w-64">
            <Label htmlFor="lead-pg-filter" className="sr-only">
              Filter by listing
            </Label>
            <Select value={pgId} onValueChange={setPgId}>
              <SelectTrigger id="lead-pg-filter" className="h-10 rounded-lg bg-background">
                <SelectValue placeholder="All listings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All listings</SelectItem>
                {listings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {loading ? (
        <ul className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-36 rounded-xl" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load leads"
          description={error}
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === "ALL" ? "No leads yet" : `No ${LEAD_STATUS_LABEL[tab].toLowerCase()} leads`}
          description={
            tab === "ALL"
              ? "When tenants request a callback or a visit, they'll appear here and we'll email you too."
              : "Try another filter to see the rest of your leads."
          }
          action={
            tab === "ALL" ? (
              <Button variant="outline" asChild>
                <Link href="/dashboard/pgs">Improve my listings</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {data.items.map((lead) => (
              <LeadCard key={lead.id} lead={lead} saving={savingId === lead.id} onStatusChange={changeStatus} />
            ))}
          </ul>
          {data.pagination.page < data.pagination.totalPages ? (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={loadMore} loading={loadingMore}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
