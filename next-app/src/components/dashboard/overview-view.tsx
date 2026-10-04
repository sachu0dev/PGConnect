"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  Crown,
  Eye,
  ImagePlus,
  MessageSquareText,
  PhoneCall,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LeadStatusBadge } from "./badges";
import { useDashboard } from "./dashboard-context";
import { DashboardHeading } from "./dashboard-shell";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Eye;
  href?: string;
}) {
  const body = (
    <div className="flex h-full flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

function ChecklistItem({
  done,
  title,
  description,
  href,
  cta,
}: {
  done: boolean;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      {done ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Done" />
      ) : (
        <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-label="To do" />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", done && "text-muted-foreground line-through decoration-1")}>{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {!done && href && cta ? (
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <Link href={href}>{cta}</Link>
        </Button>
      ) : null}
    </li>
  );
}

export function OverviewView() {
  const { user } = useAuth();
  const { overview, loading, error, refresh } = useDashboard();

  if (loading && !overview) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="We couldn't load your dashboard"
        description={error ?? "Please check your connection and try again."}
        action={<Button onClick={() => void refresh()}>Try again</Button>}
      />
    );
  }

  const { listings, plan, leads, verification } = overview;
  const atLimit = plan.used >= plan.listingLimit;
  const verificationStatus = verification?.status ?? null;
  const nextPlan = plan.id === "FREE" ? PLANS.BASIC : plan.id === "BASIC" ? PLANS.PREMIUM : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardHeading
        title={`Namaste, ${user?.username ?? "there"}`}
        description="Here's how your listings are doing."
        actions={
          <Button asChild>
            <Link href="/dashboard/post-pg">
              <PlusCircle /> Add listing
            </Link>
          </Button>
        }
      />

      {atLimit && listings.total > 0 && nextPlan ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 sm:flex-row sm:items-center">
          <Crown className="size-5 shrink-0" />
          <p className="flex-1 text-sm">
            You&apos;re using {plan.used} of {plan.listingLimit} listing{plan.listingLimit === 1 ? "" : "s"} on the{" "}
            {plan.name} plan. Upgrade to {nextPlan.name} to list up to {nextPlan.listingLimit} PGs and get priority
            placement.
          </p>
          <Button size="sm" asChild>
            <Link href="/membership">See plans</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Live listings"
          value={listings.active}
          hint={`${plan.used}/${plan.listingLimit} plan slots used`}
          icon={Building2}
          href="/dashboard/pgs"
        />
        <StatCard label="Listing views" value={overview.views.toLocaleString("en-IN")} hint="All time" icon={Eye} />
        <StatCard
          label="New leads"
          value={leads.new}
          hint={`${leads.last7Days} in the last 7 days`}
          icon={PhoneCall}
          href="/dashboard/leads"
        />
        <StatCard
          label="Unread messages"
          value={overview.unreadMessages}
          hint="From tenants"
          icon={MessageSquareText}
          href="/chat"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-sm" aria-labelledby="setup-heading">
          <h2 id="setup-heading" className="text-lg font-semibold">
            Get more tenant enquiries
          </h2>
          <p className="text-sm text-muted-foreground">Complete these steps to make your listings stand out.</p>
          <ul className="mt-2 divide-y">
            <ChecklistItem done title="Create your owner account" description="You can now list and manage PGs." />
            <ChecklistItem
              done={listings.total > 0}
              title="Publish your first listing"
              description="Add rent, sharing options, amenities and photos."
              href="/dashboard/post-pg"
              cta="Add listing"
            />
            <ChecklistItem
              done={verificationStatus === "APPROVED"}
              title={verificationStatus === "PENDING" ? "Verification in review" : "Get the Verified owner badge"}
              description={
                verificationStatus === "PENDING"
                  ? "We'll email you as soon as our team has reviewed your document."
                  : verificationStatus === "REJECTED"
                    ? "Your last request needs changes. Check the note and resubmit."
                    : "Tenants trust verified owners more — it takes 2 minutes."
              }
              href={verificationStatus === "PENDING" ? undefined : "/dashboard/verify-owner"}
              cta={verificationStatus === "REJECTED" ? "Resubmit" : "Get verified"}
            />
            <ChecklistItem
              done={overview.photosOk}
              title="Add 6 or more photos to every listing"
              description="Rooms, washroom, kitchen and building front get the most clicks."
              href="/dashboard/pgs"
              cta="Add photos"
            />
            <ChecklistItem
              done={leads.total > 0 && leads.new === 0}
              title="Respond to new leads quickly"
              description={
                leads.total === 0
                  ? "When tenants request a callback or visit, they'll show up here."
                  : "Tenants usually enquire at several PGs — a quick call back helps you stand out."
              }
              href={leads.new > 0 ? "/dashboard/leads" : undefined}
              cta="View leads"
            />
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm" aria-labelledby="leads-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="leads-heading" className="text-lg font-semibold">
              Recent leads
            </h2>
            <Button variant="link" size="sm" asChild className="px-0">
              <Link href="/dashboard/leads">
                View all <ArrowRight />
              </Link>
            </Button>
          </div>
          {overview.recentLeads.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No enquiries yet. Listings with complete details and 6+ photos get noticed sooner.
            </div>
          ) : (
            <ul className="mt-3 divide-y">
              {overview.recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <PhoneCall className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {lead.name ?? lead.user.username}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {lead.type === "VISIT" ? "Visit request" : "Callback"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.pg.name} · {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="mb-3 text-lg font-semibold">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/dashboard/post-pg", icon: PlusCircle, label: "Add a new PG" },
            { href: "/dashboard/pgs", icon: ImagePlus, label: "Update photos & rent" },
            { href: "/dashboard/verify-owner", icon: ShieldCheck, label: "Owner verification" },
            { href: "/membership", icon: Crown, label: "Plans & billing" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-medium shadow-sm transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-5 text-primary" />
              {label}
              <ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
