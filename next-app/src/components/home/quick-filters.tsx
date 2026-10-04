import Link from "next/link";
import { IndianRupee, Sparkles, User, UserRound, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const CHIPS = [
  { label: "Boys", icon: User, params: { gender: "MALE" } },
  { label: "Girls", icon: UserRound, params: { gender: "FEMALE" } },
  { label: "Co-living", icon: Sparkles, params: { gender: "ANY" } },
  { label: "With food", icon: UtensilsCrossed, params: { food: "true" } },
  { label: "Under ₹8,000", icon: IndianRupee, params: { maxRent: "8000" } },
] as const;

/** One-tap shortcuts into common searches. Optional base params (e.g. a city). */
export function QuickFilters({ base, className }: { base?: Record<string, string>; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Popular searches">
      {CHIPS.map(({ label, icon: Icon, params }) => {
        const qs = new URLSearchParams({ ...base, ...params }).toString();
        return (
          <li key={label}>
            <Link
              href={`/pgs?${qs}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
