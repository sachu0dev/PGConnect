import { BedDouble, Building2, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("en-IN");

/** Live platform numbers. Zero values are hidden; nothing is ever padded or faked. */
export function StatsStrip({
  stats,
  className,
}: {
  stats: { listings: number; cities: number; beds: number };
  className?: string;
}) {
  const items = [
    { value: stats.listings, label: stats.listings === 1 ? "PG listed" : "PGs listed", icon: Building2 },
    { value: stats.beds, label: "beds", icon: BedDouble },
    { value: stats.cities, label: stats.cities === 1 ? "city" : "cities", icon: MapPinned },
  ].filter((i) => i.value > 0);
  if (items.length === 0) return null;

  return (
    <dl className={cn("flex flex-wrap gap-x-8 gap-y-3", className)}>
      {items.map(({ value, label, icon: Icon }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon className="size-5 text-primary" aria-hidden />
          <dt className="sr-only">{label}</dt>
          <dd className="text-sm text-muted-foreground">
            <span className="text-lg font-bold text-foreground">{nf.format(value)}</span> {label}
          </dd>
        </div>
      ))}
    </dl>
  );
}
