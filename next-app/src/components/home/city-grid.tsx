import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { POPULAR_CITIES } from "@/lib/constants";
import { citySlug, pluralize, titleCase } from "@/lib/format";

const TINTS = [
  "from-teal-500/15 to-emerald-500/5 text-teal-700 dark:text-teal-300",
  "from-sky-500/15 to-cyan-500/5 text-sky-700 dark:text-sky-300",
  "from-amber-500/15 to-orange-500/5 text-amber-700 dark:text-amber-300",
  "from-rose-500/15 to-pink-500/5 text-rose-700 dark:text-rose-300",
  "from-violet-500/15 to-indigo-500/5 text-violet-700 dark:text-violet-300",
  "from-lime-500/15 to-green-500/5 text-lime-700 dark:text-lime-300",
];

/** Cities with live listings first (by count), then the remaining popular cities. */
export function mergeCities(counts: { city: string; count: number }[], limit = 12) {
  const map = new Map<string, number>();
  for (const c of counts) map.set(c.city, c.count);
  for (const c of POPULAR_CITIES) if (!map.has(c)) map.set(c, 0);
  return [...map.entries()].map(([city, count]) => ({ city, count })).slice(0, limit);
}

export function CityGrid({ cities }: { cities: { city: string; count: number }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cities.map(({ city, count }, i) => (
        <li key={city}>
          <Link
            href={`/pg-in/${citySlug(city)}`}
            className={`group flex h-full items-center gap-3 rounded-xl border bg-gradient-to-br p-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${TINTS[i % TINTS.length]}`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm">
              <Building2 className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-foreground">{titleCase(city)}</span>
              <span className="block text-xs text-muted-foreground">
                {count > 0 ? pluralize(count, "PG") : "Explore PGs"}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
