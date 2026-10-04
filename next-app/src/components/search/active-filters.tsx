import Link from "next/link";
import { X } from "lucide-react";
import { activePills, buildHref, clearFilters, type FilterState } from "./search-url";

/** Removable pills for every applied filter (plain links, no client JS). */
export function ActiveFilters({ state }: { state: FilterState }) {
  const pills = activePills(state);
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Applied filters">
      {pills.map((pill) => (
        <Link
          key={pill.key}
          href={buildHref("/pgs", pill.next)}
          scroll={false}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Remove filter: ${pill.label}`}
        >
          {pill.label}
          <X className="size-3.5" aria-hidden />
        </Link>
      ))}
      {pills.length > 1 ? (
        <Link
          href={buildHref("/pgs", clearFilters(state))}
          scroll={false}
          className="rounded px-1 text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear all
        </Link>
      ) : null}
    </div>
  );
}
