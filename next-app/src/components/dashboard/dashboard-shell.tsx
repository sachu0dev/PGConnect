"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  PhoneCall,
  PlusCircle,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { SiteHeader } from "@/components/site/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";
import { PlanBadge, VerificationBadge } from "./badges";
import { DashboardProvider, useDashboard } from "./dashboard-context";
import { OwnerOnboarding } from "./owner-onboarding";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: "leads" | "messages";
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/pgs", label: "My listings", icon: Building2 },
  { href: "/dashboard/post-pg", label: "Add listing", icon: PlusCircle },
  { href: "/dashboard/leads", label: "Leads", icon: PhoneCall, badge: "leads" },
  { href: "/chat", label: "Messages", icon: MessageSquareText, badge: "messages" },
  { href: "/dashboard/verify-owner", label: "Verification", icon: ShieldCheck },
  { href: "/membership", label: "Plan & billing", icon: CreditCard },
  { href: "/account", label: "Account", icon: UserRound },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-primary-foreground",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function DashboardNav({ variant, unread }: { variant: "desktop" | "mobile"; unread: number }) {
  const pathname = usePathname();
  const { overview } = useDashboard();
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  const countFor = (item: NavItem) =>
    item.badge === "leads" ? (overview?.leads.new ?? 0) : item.badge === "messages" ? unread : 0;

  if (variant === "desktop") {
    return (
      <nav aria-label="Owner dashboard">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                  <CountBadge count={countFor(item)} />
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 border-t pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to site
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Owner dashboard"
      className="sticky top-16 z-30 -mx-4 border-b bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden"
    >
      <ul className="scrollbar-none flex gap-1 overflow-x-auto py-2">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                ref={active ? activeRef : undefined}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
                <CountBadge
                  count={countFor(item)}
                  className={cn("ml-0.5", active && "bg-primary-foreground text-primary")}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function OwnerSummary({ compact }: { compact?: boolean }) {
  const { user } = useAuth();
  const { overview } = useDashboard();
  if (!user) return null;
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <PlanBadge plan={user.membership} />
        <VerificationBadge status={overview?.verification?.status ?? user.ownerVerification} />
      </div>
    );
  }
  return (
    <div className="mb-4 rounded-xl border bg-card p-4">
      <p className="truncate font-semibold">{user.username}</p>
      <p className="text-xs text-muted-foreground">Owner account</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <PlanBadge plan={user.membership} />
        <VerificationBadge status={overview?.verification?.status ?? user.ownerVerification} />
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireAuth();
  const unread = useUnreadCount();
  const isOwner = Boolean(user && (user.isOwner || user.isAdmin));

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <SiteHeader />
      <DashboardProvider enabled={ready && isOwner}>
        <div className="container flex-1 py-4 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:py-8">
          {ready && isOwner ? (
            <>
              <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
                <OwnerSummary />
                <DashboardNav variant="desktop" unread={unread} />
              </aside>
              <div className="pb-2 lg:hidden">
                <OwnerSummary compact />
              </div>
              <DashboardNav variant="mobile" unread={unread} />
              <main id="main" className="min-w-0 pt-4 lg:pt-0">
                {children}
              </main>
            </>
          ) : ready ? (
            <main id="main" className="py-6 lg:col-span-2">
              <OwnerOnboarding />
            </main>
          ) : (
            <>
              <aside className="hidden lg:block">
                <Skeleton className="h-28 rounded-xl" />
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 rounded-lg" />
                  ))}
                </div>
              </aside>
              <main className="pt-4 lg:pt-0">
                <ShellSkeleton />
              </main>
            </>
          )}
        </div>
      </DashboardProvider>
    </div>
  );
}

/** Page heading used across dashboard screens. */
export function DashboardHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
