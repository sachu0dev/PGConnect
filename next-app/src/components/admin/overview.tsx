"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Building2,
  Flag,
  MessageSquareText,
  PauseCircle,
  PhoneCall,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AdminOverview as Overview } from "@/server/admin";
import { AdminPageHeader, ErrorPanel } from "./shared";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  hint?: string;
  tone?: "attention" | "default";
};

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  const attention = stat.tone === "attention" && stat.value > 0;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            attention ? "bg-warning/20 text-warning-foreground dark:text-warning" : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        {stat.href ? (
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">{stat.value.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-sm font-medium">{stat.label}</p>
      {stat.hint ? <p className="mt-0.5 text-xs text-muted-foreground">{stat.hint}</p> : null}
    </>
  );
  const className = cn(
    "group block rounded-xl border bg-card p-5 shadow-sm transition-colors",
    attention && "border-warning/50",
    stat.href && "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );
  return stat.href ? (
    <Link href={stat.href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    api<Overview>("/api/admin/overview", { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err, "Could not load the overview"));
      });
    return () => controller.abort();
  }, [nonce]);

  const sections: { title: string; stats: Stat[] }[] = data
    ? [
        {
          title: "Needs attention",
          stats: [
            {
              label: "Pending verifications",
              value: data.pendingVerifications,
              icon: ShieldCheck,
              href: "/admin/verifications",
              hint: "Owner ID checks waiting for review",
              tone: "attention",
            },
            {
              label: "Open reports",
              value: data.openReports,
              icon: Flag,
              href: "/admin/reports",
              hint: "Listings flagged by tenants",
              tone: "attention",
            },
          ],
        },
        {
          title: "Marketplace",
          stats: [
            { label: "Total users", value: data.users, icon: Users, href: "/admin/users" },
            { label: "Owners", value: data.owners, icon: Building2, href: "/admin/users" },
            { label: "Banned users", value: data.bannedUsers, icon: Ban, href: "/admin/users" },
            {
              label: "Active listings",
              value: data.listings.ACTIVE,
              icon: Building2,
              href: "/admin/listings",
              hint: `${data.listings.total.toLocaleString("en-IN")} listings in total`,
            },
            { label: "Paused listings", value: data.listings.PAUSED, icon: PauseCircle, href: "/admin/listings" },
            { label: "Blocked listings", value: data.listings.BLOCKED, icon: Ban, href: "/admin/listings" },
          ],
        },
        {
          title: "Last 7 days",
          stats: [
            { label: "New users", value: data.last7Days.newUsers, icon: UserPlus },
            { label: "New listings", value: data.last7Days.newListings, icon: Building2 },
            { label: "Callback & visit requests", value: data.last7Days.leads, icon: PhoneCall },
            { label: "Chat messages", value: data.last7Days.messages, icon: MessageSquareText },
          ],
        },
      ]
    : [];

  return (
    <>
      <AdminPageHeader title="Overview" description="Health of the marketplace at a glance." />
      {error ? (
        <ErrorPanel message={error} onRetry={() => setNonce((n) => n + 1)} />
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`admin-sec-${index}`}>
              <h2 id={`admin-sec-${index}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {section.stats.map((stat) => (
                  <StatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
