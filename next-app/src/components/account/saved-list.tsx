"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, RefreshCw } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PgCard } from "@/components/listings/pg-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import type { PgCard as PgCardData } from "@/lib/types";

export function SavedList() {
  const { ready } = useRequireAuth();
  const [items, setItems] = useState<PgCardData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setError(null);
    api<PgCardData[]>("/api/account/favorites", { signal: controller.signal })
      .then(setItems)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err, "Couldn't load your saved PGs"));
      });
    return () => controller.abort();
  }, [ready, attempt]);

  if (error) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load your saved PGs"
        description={error}
        action={<Button onClick={() => setAttempt((a) => a + 1)}>Try again</Button>}
      />
    );
  }

  if (!items) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading saved PGs">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No saved PGs yet"
        description="Tap the heart on any PG to shortlist it here and compare rent, food and amenities later."
        action={
          <Button asChild>
            <Link href="/pgs">Explore PGs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? "PG" : "PGs"} in your shortlist. Listings that are full or paused are hidden.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((pg, i) => (
          <PgCard key={pg.id} pg={pg} saved priority={i < 3} />
        ))}
      </div>
    </>
  );
}
