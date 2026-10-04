"use client";

import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Link2, ShieldCheck } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAccount } from "./delete-account";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";
import { SectionCard } from "./section-card";

const PLAN_LABEL = { FREE: "Free", BASIC: "Basic", PREMIUM: "Premium" } as const;

export function AccountOverview() {
  const { user, ready } = useRequireAuth();

  if (!ready || !user) return <AccountSkeleton />;

  const memberSince = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(user.createdAt)
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <ProfileForm key={user.id} user={user} />
        <PasswordForm key={String(user.hasPassword)} hasPassword={user.hasPassword} />
        <DeleteAccount user={user} />
      </div>
      <aside className="space-y-6">
        <SectionCard icon={ShieldCheck} title="Your account">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-medium">{memberSince}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Account type</dt>
              <dd>
                <Badge variant={user.isOwner ? "default" : "secondary"}>{user.isOwner ? "PG owner" : "Tenant"}</Badge>
              </dd>
            </div>
            {user.isOwner ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium">{PLAN_LABEL[user.membership]}</dd>
              </div>
            ) : null}
          </dl>
        </SectionCard>

        <SectionCard icon={Link2} title="Connected accounts">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <GoogleMark />
              <div>
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-muted-foreground">
                  {user.hasGoogle ? "You can sign in with Google" : "Not connected"}
                </p>
              </div>
            </div>
            {user.hasGoogle ? (
              <Badge variant="success">
                <CheckCircle2 /> Connected
              </Badge>
            ) : (
              <Badge variant="muted">Off</Badge>
            )}
          </div>
          {!user.hasGoogle ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Use &ldquo;Continue with Google&rdquo; on the login page with {user.email} to connect it.
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          icon={Building2}
          title={user.isOwner ? "Owner dashboard" : "Own a PG?"}
          description={
            user.isOwner
              ? "Manage your listings, leads and verification."
              : "List your PG for free and get enquiries directly from tenants — no brokers."
          }
        >
          <Button asChild variant={user.isOwner ? "default" : "outline"} className="w-full">
            <Link href={user.isOwner ? "/dashboard" : "/owners"}>
              {user.isOwner ? "Go to dashboard" : "List your PG"} <ArrowRight />
            </Link>
          </Button>
        </SectionCard>
      </aside>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-6" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AccountSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]" aria-busy="true" aria-label="Loading your account">
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-4 rounded-xl border p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-32" />
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
