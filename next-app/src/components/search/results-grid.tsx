import { PgCard, PgCardSkeleton } from "@/components/listings/pg-card";
import type { PgCard as PgCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ResultsGrid({ items, className }: { items: PgCardData[]; className?: string }) {
  return (
    <ul className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {items.map((pg, i) => (
        <li key={pg.id} className="flex">
          <PgCard pg={pg} priority={i < 3} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export function ResultsGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <PgCardSkeleton key={i} />
      ))}
    </div>
  );
}
