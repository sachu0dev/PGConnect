"use client";

import Link from "next/link";
import { Crown, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { ListingForm } from "@/components/owner/listing-form";
import { PLANS } from "@/lib/constants";
import { useDashboard } from "./dashboard-context";
import { DashboardHeading } from "./dashboard-shell";

export function CreateListingView() {
  const { user } = useAuth();
  const { overview, loading, error } = useDashboard();

  if (!overview && (loading || !error)) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const plan = overview?.plan;
  const atLimit = Boolean(plan && plan.used >= plan.listingLimit && !user?.isAdmin);
  const nextPlan = plan?.id === "FREE" ? PLANS.BASIC : plan?.id === "BASIC" ? PLANS.PREMIUM : null;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <DashboardHeading
        title="Add your PG"
        description="Six quick steps. You can edit everything later from My listings."
      />

      {atLimit && plan ? (
        <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
            <Crown className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">You&apos;ve used all listing slots on your plan</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            The {plan.name} plan includes {plan.listingLimit} listing{plan.listingLimit === 1 ? "" : "s"} (paused ones
            count too).{" "}
            {nextPlan
              ? `Upgrade to ${nextPlan.name} to list up to ${nextPlan.listingLimit} PGs, or delete a listing you no longer need.`
              : "Delete a listing you no longer need, or contact us for a custom plan."}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            {nextPlan ? (
              <Button asChild>
                <Link href="/membership">
                  <Crown /> See plans
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/dashboard/pgs">
                <ListChecks /> Manage my listings
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <ListingForm mode="create" defaultContact={user?.phoneNumber} />
      )}
    </div>
  );
}
