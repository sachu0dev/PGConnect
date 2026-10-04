"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MAPS_API_KEY } from "./maps-config";
import type { MapItem } from "./results-map";

const ResultsMap = MAPS_API_KEY
  ? dynamic(() => import("./results-map"), {
      ssr: false,
      loading: () => <Skeleton className="h-[70dvh] w-full rounded-xl" />,
    })
  : null;

/** List / map toggle. Without a Google Maps key it simply renders the list. */
export function ResultsView({ items, children }: { items: MapItem[]; children: ReactNode }) {
  const [view, setView] = useState<"list" | "map">("list");
  const mappable = items.filter((i) => i.latitude !== null && i.longitude !== null);
  if (!ResultsMap || mappable.length === 0) return <>{children}</>;

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Results view" className="inline-flex rounded-lg border bg-muted/50 p-1">
        {(
          [
            { value: "list", label: "List", icon: List },
            { value: "map", label: "Map", icon: MapIcon },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={view === value}
            onClick={() => setView(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      {view === "map" ? <ResultsMap items={mappable} /> : children}
    </div>
  );
}
